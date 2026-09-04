import { MantaClient } from "mantahq-sdk";

const API_KEY = import.meta.env.VITE_MANTA_API_KEY;

const manta = new MantaClient({
  sdkKey: API_KEY,
});

export default manta;
