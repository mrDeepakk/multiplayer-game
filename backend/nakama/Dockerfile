# backend/nakama/Dockerfile

FROM heroiclabs/nakama:3.5.0

# Copy JS modules directly
COPY modules /nakama/data/modules

# Copy config
COPY local.yml /nakama/data/local.yml

# Run Nakama
CMD ["nakama", "--config", "/nakama/data/local.yml", "--database.address", "postgres:5432"]