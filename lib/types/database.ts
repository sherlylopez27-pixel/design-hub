export type ProjectStatus = 'draft' | 'active' | 'closed'
export type ResultsMode = 'after_vote' | 'after_close' | 'never'

export type Database = {
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          email: string
          added_by: string | null
          created_at: string
        }
        Insert: {
          email: string
          added_by?: string | null
          created_at?: string
        }
        Update: {
          email?: string
          added_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id: string
          name?: string
          email: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          title: string
          description: string
          status: ProjectStatus
          deadline: string | null
          results_mode: ResultsMode
          slug: string
          short_id: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          status?: ProjectStatus
          deadline?: string | null
          results_mode?: ResultsMode
          slug: string
          short_id: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: ProjectStatus
          deadline?: string | null
          results_mode?: ResultsMode
          slug?: string
          short_id?: string
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      design_versions: {
        Row: {
          id: string
          project_id: string
          title: string
          image_url: string
          figma_link: string
          xd_link: string
          prototype_link: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          image_url?: string
          figma_link?: string
          xd_link?: string
          prototype_link?: string
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          image_url?: string
          figma_link?: string
          xd_link?: string
          prototype_link?: string
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          id: string
          project_id: string
          selected_version_id: string
          voter_name: string
          voter_email: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          selected_version_id: string
          voter_name: string
          voter_email: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          selected_version_id?: string
          voter_name?: string
          voter_email?: string
          reason?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_vote_counts: {
        Args: { p_project_id: string }
        Returns: { version_id: string; vote_count: number }[]
      }
      get_total_votes: {
        Args: { p_project_id: string }
        Returns: number
      }
      is_project_live: {
        Args: { p: string; d: string | null }
        Returns: boolean
      }
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: {
      project_status: 'draft' | 'active' | 'closed'
      results_mode: 'after_vote' | 'after_close' | 'never'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type DesignVersion = Database['public']['Tables']['design_versions']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type AdminAllowlist = Database['public']['Tables']['admin_allowlist']['Row']

export interface ProjectWithVersions extends Project {
  design_versions: DesignVersion[]
}

export interface VoteCount {
  version_id: string
  vote_count: number
}
