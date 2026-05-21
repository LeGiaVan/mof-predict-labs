export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cytotoxicity_predictions: {
        Row: {
          cell_type: string | null
          central_metal_atom: string | null
          concentration: number | null
          exposure_time: number | null
          organic_ligand: string | null
          predicted_cell_viability: number | null
          prediction_date: string | null
          prediction_id: number
          size: number | null
          zeta_potential: number | null
        }
        Insert: {
          cell_type?: string | null
          central_metal_atom?: string | null
          concentration?: number | null
          exposure_time?: number | null
          organic_ligand?: string | null
          predicted_cell_viability?: number | null
          prediction_date?: string | null
          prediction_id?: number
          size?: number | null
          zeta_potential?: number | null
        }
        Update: {
          cell_type?: string | null
          central_metal_atom?: string | null
          concentration?: number | null
          exposure_time?: number | null
          organic_ligand?: string | null
          predicted_cell_viability?: number | null
          prediction_date?: string | null
          prediction_id?: number
          size?: number | null
          zeta_potential?: number | null
        }
        Relationships: []
      }
      drug_loading_predictions: {
        Row: {
          bit148: boolean | null
          bit223: boolean | null
          bit657: boolean | null
          central_metal_atom: string | null
          organic_ligand: string | null
          predicted_loading_capacity: number | null
          prediction_date: string | null
          prediction_id: number
        }
        Insert: {
          bit148?: boolean | null
          bit223?: boolean | null
          bit657?: boolean | null
          central_metal_atom?: string | null
          organic_ligand?: string | null
          predicted_loading_capacity?: number | null
          prediction_date?: string | null
          prediction_id?: number
        }
        Update: {
          bit148?: boolean | null
          bit223?: boolean | null
          bit657?: boolean | null
          central_metal_atom?: string | null
          organic_ligand?: string | null
          predicted_loading_capacity?: number | null
          prediction_date?: string | null
          prediction_id?: number
        }
        Relationships: []
      }
      drugs: {
        Row: {
          drug_id: number
          drug_name: string
          morgan_fp_bit148: boolean | null
          morgan_fp_bit223: boolean | null
          morgan_fp_bit657: boolean | null
          smiles_string: string | null
        }
        Insert: {
          drug_id?: number
          drug_name: string
          morgan_fp_bit148?: boolean | null
          morgan_fp_bit223?: boolean | null
          morgan_fp_bit657?: boolean | null
          smiles_string?: string | null
        }
        Update: {
          drug_id?: number
          drug_name?: string
          morgan_fp_bit148?: boolean | null
          morgan_fp_bit223?: boolean | null
          morgan_fp_bit657?: boolean | null
          smiles_string?: string | null
        }
        Relationships: []
      }
      mofs: {
        Row: {
          central_metal_atom: string | null
          functional_group: string | null
          mof_id: number
          mof_name: string | null
          organic_ligand: string | null
        }
        Insert: {
          central_metal_atom?: string | null
          functional_group?: string | null
          mof_id?: number
          mof_name?: string | null
          organic_ligand?: string | null
        }
        Update: {
          central_metal_atom?: string | null
          functional_group?: string | null
          mof_id?: number
          mof_name?: string | null
          organic_ligand?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
