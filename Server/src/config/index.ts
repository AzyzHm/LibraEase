import dotenv from 'dotenv';

dotenv.config();

const supabase_url: string = process.env.SUPABASE_URL || "";
const supabase_service_key: string = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const PORT: number = process.env.SERVER_PORT ? (parseInt(process.env.SERVER_PORT)) : 8000;
const ROUNDS: number = process.env.SERVER_ROUNDS ? (parseInt(process.env.SERVER_ROUNDS)) : Math.floor(Math.random() * 10) + 1;

export const config = {
    supabase: {
        url: supabase_url,
        serviceKey: supabase_service_key
    },
    server: {
        port: PORT,
        rounds: ROUNDS
    }
};
