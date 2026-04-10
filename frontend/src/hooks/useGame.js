import { useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@heroiclabs/nakama-js";

/** Must match server default in `backend/nakama/modules/tictactoe.js` */
export const TURN_TIMER_SECONDS = 30;

function syncInviteUrl(matchId) {
  if (typeof window === "undefined" || !matchId) return;
  const url = new URL(window.location.href);
  url.searchParams.set("match", matchId);
  window.history.replaceState(null, "", url.toString());
}

function normalizeNickname(value) {
  const trimmed = (value || "").trim().slice(0, 20);
  const safe = trimmed.replace(/[^a-zA-Z0-9_]/g, "");
  return safe.slice(0, 20);
}

export default function useGame() {
  const [state, setState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [playerMark, setPlayerMark] = useState(null);
  const [playerName, setPlayerName] = useState(() => localStorage.getItem("tttNickname") || "");
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchId, setMatchId] = useState("");
  const [matchmakingTicket, setMatchmakingTicket] = useState(null);
  const [matchmakingStatus, setMatchmakingStatus] = useState("idle");
  const [error, setError] = useState("");

  const clientRef = useRef(null);
  const socketRef = useRef(null);
  const matchRef = useRef(null);
  const sessionRef = useRef(null);
  const autoJoinFromUrlRef = useRef(false);

  function decode(data) {
    try {
      if (typeof data === "object" && data !== null && !ArrayBuffer.isView(data)) {
        const maybeNumericKeys = Object.keys(data).every((key) => /^\d+$/.test(key));
        if (maybeNumericKeys) {
          const bytes = Uint8Array.from(
            Object.keys(data)
              .map((key) => Number(key))
              .sort((a, b) => a - b)
              .map((index) => data[index])
          );
          return JSON.parse(new TextDecoder().decode(bytes));
        }
        return data;
      }

      const text = typeof data === "string" ? data : new TextDecoder().decode(data);
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  function updateState(newState) {
    if (!newState || !newState.board) return;
    setState(newState);

    if (sessionRef.current && newState.players) {
      const me = newState.players.find(
        (p) => p.user_id === sessionRef.current.user_id
      );
      if (me) {
        setPlayerMark(me.mark);
      } else {
        setPlayerMark(null);
      }
    }
  }

  async function refreshLeaderboard() {
    if (!clientRef.current || !sessionRef.current) return;
    try {
      const response = await clientRef.current.rpc(sessionRef.current, "get_ttt_leaderboard", "{}");
      const payload = JSON.parse(response.payload || "{}");
      setLeaderboard(Array.isArray(payload.leaderboard) ? payload.leaderboard : []);
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    }
  }

  async function connect() {
    if (socketRef.current) return;

    setLoading(true);
    setError("");
    try {
      const client = new Client("defaultkey", "127.0.0.1", "7350", false);
      clientRef.current = client;

      let deviceId = localStorage.getItem("deviceId");
      if (!deviceId) {
        deviceId = "dev-" + Math.random().toString(36).substring(2);
        localStorage.setItem("deviceId", deviceId);
      }

      const session = await client.authenticateDevice(deviceId);
      sessionRef.current = session;

      const normalizedName = normalizeNickname(playerName);
      if (normalizedName) {
        try {
          await client.updateAccount(session, { username: normalizedName });
          if (normalizedName !== playerName) {
            setPlayerName(normalizedName);
            localStorage.setItem("tttNickname", normalizedName);
          }
        } catch (nameErr) {
          console.error("Nickname update failed", nameErr);
          setError("Nickname is invalid. Use letters, numbers, underscore.");
        }
      }

      const socket = client.createSocket(false);

      socket.onmatchdata = (msg) => {
        const parsed = decode(msg.data);
        if (parsed) updateState(parsed);
      };

      socket.onmatchmakermatched = async (matched) => {
        try {
          setMatchmakingStatus("matched");
          const joined = await socket.joinMatch(undefined, matched.token);
          matchRef.current = joined.match_id;
          setMatchId(joined.match_id);
          syncInviteUrl(joined.match_id);
          setConnectionStatus("in_match");
          setMatchmakingTicket(null);
          setMatchmakingStatus("idle");
        } catch (err) {
          console.error("Failed to join matched game", err);
          setError("Could not join matched game.");
          setMatchmakingStatus("idle");
        }
      };

      await socket.connect(session);
      socketRef.current = socket;
      setConnectionStatus("connected");
      await refreshLeaderboard();
    } catch (err) {
      console.error("Connect failed", err);
      setConnectionStatus("idle");
      setError("Could not connect to game server.");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  async function saveNickname(name) {
    const normalized = normalizeNickname(name);
    if (!normalized) return;
    setPlayerName(normalized);
    localStorage.setItem("tttNickname", normalized);
    if (clientRef.current && sessionRef.current) {
      try {
        await clientRef.current.updateAccount(sessionRef.current, { username: normalized });
      } catch (err) {
        console.error("Save nickname failed", err);
        setError("Nickname update failed. Use letters, numbers, underscore.");
      }
    }
  }

  async function createMatch() {
    try {
      await connect();
    } catch {
      return null;
    }
    setLoading(true);
    setError("");

    try {
      const rpcRes = await clientRef.current.rpc(
        sessionRef.current,
        "create_tictactoe_match",
        JSON.stringify({ timerSeconds: TURN_TIMER_SECONDS })
      );
      const payload = rpcRes.payload
      console.log("RPC response:", payload);
      const createdMatchId = payload.matchId;
      if (!createdMatchId) {
        throw new Error("Failed to create authoritative match");
      }

      try {
        const joined = await socketRef.current.joinMatch(createdMatchId);
        matchRef.current = joined.match_id;
        setMatchId(joined.match_id);
        syncInviteUrl(joined.match_id);
      } catch (joinErr) {
        // Match can still be created even if auto-join fails.
        console.error("Auto-join after create failed:", joinErr);
        matchRef.current = createdMatchId;
        setMatchId(createdMatchId);
        syncInviteUrl(createdMatchId);
        setError("Match created. Share ID or try join once.");
      }

      setState({
        board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        players: [],
        status: "waiting",
        turn: null,
        winner: null,
        winningLine: null,
        score: { x: 0, o: 0 },
      });
      setConnectionStatus("in_match");
      return createdMatchId;
    } catch (err) {
      console.error("Create error:", err);
      setError("Could not create match.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function joinMatch(id) {
    if (!id || !id.trim()) return;
    try {
      await connect();
    } catch {
      return;
    }
    setLoading(true);
    setError("");

    try {
      const joined = await socketRef.current.joinMatch(id.trim());
      matchRef.current = joined.match_id;
      setMatchId(joined.match_id);
      syncInviteUrl(joined.match_id);
      setConnectionStatus("in_match");
    } catch (err) {
      console.error("Join error:", err);
      setError("Could not join this match.");
    } finally {
      setLoading(false);
    }
  }

  async function findRandomMatch() {
    try {
      await connect();
    } catch {
      return;
    }
    if (!socketRef.current || matchmakingTicket) return;
    setError("");
    setMatchmakingStatus("searching");
    try {
      // Prefer joining an already waiting authoritative TicTacToe room first.
      const list = await clientRef.current.listMatches(
        sessionRef.current,
        20,
        true,
        null,
        1,
        1,
        null
      );
      const waitingMatch = (list.matches || []).find((match) => {
        if (!match?.authoritative || match?.size !== 1) return false;
        if (!match.label) return true;
        try {
          const parsed = JSON.parse(match.label);
          return parsed.mode === "tictactoe";
        } catch {
          return true;
        }
      });

      if (waitingMatch?.match_id) {
        const joined = await socketRef.current.joinMatch(waitingMatch.match_id);
        matchRef.current = joined.match_id;
        setMatchId(joined.match_id);
        syncInviteUrl(joined.match_id);
        setConnectionStatus("in_match");
        setMatchmakingStatus("idle");
        return;
      }

      const res = await socketRef.current.addMatchmaker("*", 2, 2, { mode: "tictactoe" });
      setMatchmakingTicket(res.ticket);
    } catch (err) {
      console.error("Matchmaker add failed", err);
      setError("Unable to start matchmaking.");
      setMatchmakingStatus("idle");
    }
  }

  async function cancelFindMatch() {
    if (!socketRef.current || !matchmakingTicket) return;
    try {
      await socketRef.current.removeMatchmaker(matchmakingTicket);
    } catch (err) {
      console.error("Matchmaker remove failed", err);
    } finally {
      setMatchmakingTicket(null);
      setMatchmakingStatus("idle");
    }
  }

  function sendMove(index) {
    if (!socketRef.current || !matchRef.current) return;
    if (!Number.isInteger(index) || index < 0 || index > 8) return;

    socketRef.current.sendMatchState(
      matchRef.current,
      1,
      JSON.stringify({ type: "move", index })
    );
  }

  function sendRematch() {
    if (!socketRef.current || !matchRef.current) return;
    socketRef.current.sendMatchState(
      matchRef.current,
      1,
      JSON.stringify({ type: "rematch" })
    );
  }

  const myPlayer = useMemo(() => {
    if (!state?.players || !sessionRef.current) return null;
    return state.players.find((player) => player.user_id === sessionRef.current.user_id) || null;
  }, [state]);

  const opponentPlayer = useMemo(() => {
    if (!state?.players || !myPlayer) return null;
    return state.players.find((player) => player.user_id !== myPlayer.user_id) || null;
  }, [state, myPlayer]);

  const secondsLeft = useMemo(() => {
    if (!state?.turnDeadline) return 0;
    return Math.max(0, state.turnDeadline - Math.floor(Date.now() / 1000));
  }, [state]);

  useEffect(() => {
    if (!state?.turnDeadline) return undefined;
    const timer = setInterval(() => {
      setState((prev) => (prev ? { ...prev } : prev));
    }, 500);
    return () => clearInterval(timer);
  }, [state?.turnDeadline]);

  useEffect(() => {
    if (state?.status === "finished") {
      refreshLeaderboard();
    }
  }, [state?.status]);

  useEffect(() => {
    if (!playerName || autoJoinFromUrlRef.current) return;
    if (typeof window === "undefined") return;
    const invite = new URLSearchParams(window.location.search).get("match");
    if (!invite?.trim()) return;
    autoJoinFromUrlRef.current = true;
    void joinMatch(invite.trim());
    // joinMatch is stable enough for one-shot invite handling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName]);

  return {
    saveNickname,
    connect,
    createMatch,
    joinMatch,
    findRandomMatch,
    cancelFindMatch,
    refreshLeaderboard,
    sendMove,
    sendRematch,
    state,
    connectionStatus,
    playerMark,
    playerName,
    myPlayer,
    opponentPlayer,
    leaderboard,
    matchmakingStatus,
    secondsLeft,
    loading,
    matchId,
    error,
    shareJoinUrl:
      typeof window !== "undefined" && matchId
        ? `${window.location.origin}${window.location.pathname}?match=${encodeURIComponent(matchId)}`
        : "",
  };
}