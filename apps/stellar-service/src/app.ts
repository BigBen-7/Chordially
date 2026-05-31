import express from "express";
import { Networks } from "stellar-sdk";

import { env } from "./env.js";

const networkPassphrase =
  env.STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

export function createApp() {
  const app = express();

  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "stellar-service",
      network: env.STELLAR_NETWORK
    });
  });

  app.get("/api/v1/stellar/network", (_request, response) => {
    response.json({
      network: env.STELLAR_NETWORK,
      horizonUrl: env.HORIZON_URL,
      passphrase: networkPassphrase
    });
  });

  app.get("/api/v1/stellar/starter-intent", (_request, response) => {
    response.json({
      asset: "USDC",
      useCase: "hackathon-mvp",
      nextStep: "Implement authenticated wallet and payment flows."
    });
  });

  return app;
}
