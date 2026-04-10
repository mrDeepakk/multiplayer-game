// backend/nakama/modules/tictactoe.js

var OP_STATE = 1;
var MARK_X = 1;
var MARK_O = 2;
var STATS_COLLECTION = "ttt_stats";
var DEFAULT_TIMER_SECONDS = 30;
var WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

function makeEmptyBoard() { return [0, 0, 0, 0, 0, 0, 0, 0, 0]; }
function nowUnix() { return Math.floor(Date.now() / 1000); }

function decode(data, nk) {
  if (!data) return {};
  if (typeof data === "string") return JSON.parse(data);
  try {
    return JSON.parse(nk.binaryToString(data));
  } catch (_err) {
    return {};
  }
}

function getWinnerLine(board, mark) {
  for (var i = 0; i < WIN_LINES.length; i++) {
    var line = WIN_LINES[i];
    if (board[line[0]] === mark && board[line[1]] === mark && board[line[2]] === mark) return line;
  }
  return null;
}

function isBoardFull(board) {
  for (var i = 0; i < board.length; i++) if (board[i] === 0) return false;
  return true;
}

function getPlayerByUserId(state, userId) {
  return state.players.find(function (p) { return p.user_id === userId; }) || null;
}

function getPlayerByMark(state, mark) {
  return state.players.find(function (p) { return p.mark === mark; }) || null;
}

function allPlayersConnected(state) {
  return state.players.length === 2 && state.players.every(function (p) { return !!p.connected; });
}

function sanitizedState(state) {
  return JSON.stringify({
    board: state.board,
    players: state.players.map(function (p) {
      return { user_id: p.user_id, username: p.username, mark: p.mark, connected: p.connected };
    }),
    turn: state.turn,
    status: state.status,
    winner: state.winner,
    winningLine: state.winningLine,
    winnerReason: state.winnerReason,
    timerSeconds: state.timerSeconds,
    turnDeadline: state.turnDeadline,
    score: state.score
  });
}

function assignTurnDeadline(state) {
  if (state.timerSeconds > 0 && state.status === "playing") {
    state.turnDeadline = nowUnix() + state.timerSeconds;
  } else {
    state.turnDeadline = null;
  }
}

function loadStats(nk, userId) {
  var reads = nk.storageRead([{ collection: STATS_COLLECTION, key: "profile", userId: userId }]);
  if (!reads || reads.length === 0) return { wins: 0, losses: 0, draws: 0, score: 0 };
  var value = reads[0].value || {};
  return {
    wins: Number(value.wins || 0),
    losses: Number(value.losses || 0),
    draws: Number(value.draws || 0),
    score: Number(value.score || 0)
  };
}

function writeStats(nk, userId, stats) {
  nk.storageWrite([{
    collection: STATS_COLLECTION,
    key: "profile",
    userId: userId,
    value: stats,
    permissionRead: 2,
    permissionWrite: 0
  }]);
}

function applyResultStats(nk, state) {
  if (state.resultRecorded) return;
  var xPlayer = getPlayerByMark(state, MARK_X);
  var oPlayer = getPlayerByMark(state, MARK_O);
  if (!xPlayer || !oPlayer) return;

  var xStats = loadStats(nk, xPlayer.user_id);
  var oStats = loadStats(nk, oPlayer.user_id);

  if (state.winner === MARK_X) {
    xStats.wins += 1;
    xStats.score += 200;
    oStats.losses += 1;
    oStats.score = Math.max(0, oStats.score - 30);
  } else if (state.winner === MARK_O) {
    oStats.wins += 1;
    oStats.score += 200;
    xStats.losses += 1;
    xStats.score = Math.max(0, xStats.score - 30);
  } else {
    xStats.draws += 1;
    oStats.draws += 1;
    xStats.score += 50;
    oStats.score += 50;
  }

  writeStats(nk, xPlayer.user_id, xStats);
  writeStats(nk, oPlayer.user_id, oStats);
  state.resultRecorded = true;
}

function finishGame(nk, state, winnerMark, winningLine, reason) {
  state.status = "finished";
  state.winner = winnerMark;
  state.winningLine = winningLine || null;
  state.winnerReason = reason || null;
  state.turnDeadline = null;
  if (winnerMark === MARK_X) state.score.x += 1;
  if (winnerMark === MARK_O) state.score.o += 1;
  applyResultStats(nk, state);
}

function resetRound(state) {
  state.board = makeEmptyBoard();
  state.turn = MARK_X;
  state.status = "playing";
  state.winner = null;
  state.winningLine = null;
  state.winnerReason = null;
  state.resultRecorded = false;
  assignTurnDeadline(state);
}

var matchInit = function (_ctx, _logger, _nk, params) {
  var timerSeconds = (params && Number(params.timerSeconds)) || DEFAULT_TIMER_SECONDS;
  var state = {
    board: makeEmptyBoard(),
    players: [],
    turn: null,
    status: "waiting",
    winner: null,
    winningLine: null,
    winnerReason: null,
    timerSeconds: timerSeconds,
    turnDeadline: null,
    score: { x: 0, o: 0 },
    resultRecorded: false,
    label: JSON.stringify({ mode: "tictactoe", timerSeconds: timerSeconds, open: 1, players: 0 })
  };

  return { state: state, tickRate: 1, label: state.label };
};

var matchJoinAttempt = function (_ctx, _logger, _nk, _dispatcher, _tick, state, presence, _metadata) {
  var userId = presence.userId || presence.user_id;
  var existing = getPlayerByUserId(state, userId);
  if (existing) return { state: state, accept: true };
  if (state.players.length >= 2) return { state: state, accept: false, rejectMessage: "Match full" };
  return { state: state, accept: true };
};

var matchJoin = function (_ctx, _logger, _nk, dispatcher, _tick, state, presences) {
  for (var i = 0; i < presences.length; i++) {
    var presence = presences[i];
    var userId = presence.userId || presence.user_id;
    var username = presence.username || "Player";
    var existing = getPlayerByUserId(state, userId);

    if (existing) {
      existing.session_id = presence.sessionId || presence.session_id;
      existing.username = username;
      existing.connected = true;
    } else if (state.players.length < 2) {
      var mark = state.players.length === 0 ? MARK_X : MARK_O;
      state.players.push({
        user_id: userId,
        session_id: presence.sessionId || presence.session_id,
        username: username,
        mark: mark,
        connected: true
      });
    }
  }

  if (allPlayersConnected(state) && state.status === "waiting") resetRound(state);
  dispatcher.broadcastMessage(OP_STATE, sanitizedState(state));
  return { state: state };
};

var matchLeave = function (_ctx, _logger, nk, dispatcher, _tick, state, presences) {
  for (var i = 0; i < presences.length; i++) {
    var userId = presences[i].userId || presences[i].user_id;
    var player = getPlayerByUserId(state, userId);
    if (player) player.connected = false;
  }

  if (state.status === "playing") {
    var connected = state.players.filter(function (p) { return p.connected; });
    var winnerMark = connected.length === 1 ? connected[0].mark : null;
    finishGame(nk, state, winnerMark, null, "disconnect");
  }

  dispatcher.broadcastMessage(OP_STATE, sanitizedState(state));
  return { state: state };
};

var matchLoop = function (_ctx, logger, nk, dispatcher, _tick, state, messages) {
  if (state.status === "playing" && state.turnDeadline && nowUnix() >= state.turnDeadline) {
    var timedOutMark = state.turn;
    var winnerMark = timedOutMark === MARK_X ? MARK_O : MARK_X;
    finishGame(nk, state, winnerMark, null, "timeout");
    dispatcher.broadcastMessage(OP_STATE, sanitizedState(state));
  }

  for (var i = 0; i < messages.length; i++) {
    try {
      var msg = messages[i];
      var payload = decode(msg.data, nk);
      var sender = msg.sender || {};
      var senderUserId = sender.userId || sender.user_id;
      var senderPlayer = getPlayerByUserId(state, senderUserId);
      if (!senderPlayer) continue;

      if (payload.type === "move") {
        if (state.status !== "playing") continue;
        if (senderPlayer.mark !== state.turn) continue;
        if (!Number.isInteger(payload.index) || payload.index < 0 || payload.index > 8) continue;
        if (state.board[payload.index] !== 0) continue;

        state.board[payload.index] = senderPlayer.mark;
        var winningLine = getWinnerLine(state.board, senderPlayer.mark);

        if (winningLine) {
          finishGame(nk, state, senderPlayer.mark, winningLine, "line");
        } else if (isBoardFull(state.board)) {
          finishGame(nk, state, null, null, "draw");
        } else {
          state.turn = state.turn === MARK_X ? MARK_O : MARK_X;
          assignTurnDeadline(state);
        }

        dispatcher.broadcastMessage(OP_STATE, sanitizedState(state));
      } else if (payload.type === "rematch") {
        if (state.status !== "finished") continue;
        if (!allPlayersConnected(state)) continue;
        resetRound(state);
        dispatcher.broadcastMessage(OP_STATE, sanitizedState(state));
      }
    } catch (err) {
      logger.error("tictactoe loop error: %v", err);
    }
  }

  return { state: state };
};

var matchTerminate = function (_ctx, _logger, _nk, _dispatcher, _tick, state, _graceSeconds) {
  return { state: state };
};

var rpcCreateTicTacToeMatch = function (_ctx, _logger, nk, payload) {
  var parsed = {};
  if (payload) {
    try { parsed = JSON.parse(payload); } catch (_e) {}
  }
  var timerSeconds = Number(parsed.timerSeconds || DEFAULT_TIMER_SECONDS);
  var matchId = nk.matchCreate("tictactoe_match", { timerSeconds: timerSeconds });
  return JSON.stringify({ matchId: matchId });
};

var rpcGetLeaderboard = function (_ctx, _logger, nk, _payload) {
  try {
    // Nakama 3.5 runtime expects 4 args: (userId, collection, limit, cursor)
    var records = nk.storageList("", STATS_COLLECTION, 100, null);
    var objects = records && records.objects ? records.objects : [];
    var rows = objects.map(function (obj) {
      var value = obj.value || {};
      return {
        user_id: obj.userId || "",
        username: "Player",
        wins: Number(value.wins || 0),
        losses: Number(value.losses || 0),
        draws: Number(value.draws || 0),
        score: Number(value.score || 0)
      };
    });

    rows.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return b.wins - a.wins;
    });
    return JSON.stringify({ leaderboard: rows.slice(0, 10) });
  } catch (_err) {
    return JSON.stringify({ leaderboard: [] });
  }
};

var matchmakerMatched = function (_ctx, logger, nk, entries) {
  var userIds = entries.map(function (e) { return e.presence.userId || e.presence.user_id; });
  logger.info("matchmaker matched users: %q", userIds.join(","));
  return nk.matchCreate("tictactoe_match", { timerSeconds: DEFAULT_TIMER_SECONDS });
};

var InitModule = function (_ctx, _logger, _nk, initializer) {
  initializer.registerRpc("create_tictactoe_match", rpcCreateTicTacToeMatch);
  initializer.registerRpc("get_ttt_leaderboard", rpcGetLeaderboard);
  initializer.registerMatchmakerMatched(matchmakerMatched);
  initializer.registerMatch("tictactoe_match", {
    matchInit: matchInit,
    matchJoinAttempt: matchJoinAttempt,
    matchJoin: matchJoin,
    matchLeave: matchLeave,
    matchLoop: matchLoop,
    matchTerminate: matchTerminate
  });
};