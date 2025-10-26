import { Injectable } from "@nestjs/common";
import { createClient } from "@supabase/supabase-js";
import { ENV } from "./config/env";

@Injectable()
export class SupabaseService {
  private client = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_KEY);
  getClient() {
    return this.client;
  }
}
