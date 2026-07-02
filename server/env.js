// Loaded first (before any module that reads process.env) so a .env file
// at the project root is available in dev and production.
import dotenv from 'dotenv'
dotenv.config()
