export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type InterviewMode = 'realistic' | 'casual' | 'boss' | 'cute';
export type InterviewerRole = 'hr' | 'tech' | 'exec';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';
export type SessionResult = 'pending' | 'pass' | 'fail' | 'veto' | 'eliminated';
export type VideoRetention = 'seven_days' | 'thirty_days' | 'forever' | 'never';
export type QuestionCategory =
  | 'self_introduction'
  | 'motivation'
  | 'job_competency'
  | 'situation'
  | 'ethics'
  | 'organizational_fit'
  | 'follow_up';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          handle: string;
          display_name: string;
          total_sessions: number;
          total_passes: number;
          video_retention: VideoRetention;
          preferred_mode: InterviewMode;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at' | 'total_sessions' | 'total_passes'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          code: string;
          name_ko: string;
          name_en: string | null;
          description: string | null;
          talent_profile: Record<string, unknown> | null;
          core_values: Record<string, unknown> | null;
          positions: Record<string, unknown> | null;
          pass_threshold: number;
          veto_threshold: number;
          eliminate_threshold: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
        Relationships: [];
      };
      interview_sessions: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string;
          cover_letter_id: string | null;
          mode: InterviewMode;
          status: SessionStatus;
          result: SessionResult;
          hr_final_score: number | null;
          tech_final_score: number | null;
          exec_final_score: number | null;
          veto_role: InterviewerRole | null;
          elimination_question_id: string | null;
          total_questions: number;
          duration_seconds: number | null;
          video_url: string | null;
          started_at: string;
          ended_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['interview_sessions']['Row'], 'id' | 'started_at'>;
        Update: Partial<Database['public']['Tables']['interview_sessions']['Insert']>;
        Relationships: [];
      };
      questions: {
        Row: {
          id: string;
          text: string;
          category: QuestionCategory;
          target_role: InterviewerRole;
          difficulty: number;
          is_ncs_based: boolean;
          is_general: boolean;
          source: string | null;
          tags: string[] | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['questions']['Insert']>;
        Relationships: [];
      };
      session_questions: {
        Row: {
          id: string;
          session_id: string;
          question_id: string | null;
          question_text: string;
          asked_by_role: InterviewerRole;
          sequence: number;
          is_follow_up: boolean;
          parent_session_question_id: string | null;
          audio_url: string | null;
          transcript: string | null;
          duration_seconds: number | null;
          filler_count: number | null;
          score_content: number | null;
          score_fluency: number | null;
          score_eye_contact: number | null;
          score_timing: number | null;
          score_expression: number | null;
          hr_delta: number;
          tech_delta: number;
          exec_delta: number;
          hr_after: number | null;
          tech_after: number | null;
          exec_after: number | null;
          claude_feedback: Record<string, unknown> | null;
          asked_at: string;
          answered_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['session_questions']['Row'], 'id' | 'asked_at'>;
        Update: Partial<Database['public']['Tables']['session_questions']['Insert']>;
        Relationships: [];
      };
      cover_letters: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          position_code: string | null;
          items: Record<string, string>;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cover_letters']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cover_letters']['Insert']>;
        Relationships: [];
      };
      streaks: {
        Row: {
          user_id: string;
          current_streak: number;
          longest_streak: number;
          last_practiced_at: string | null;
          freeze_tokens: number;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['streaks']['Row'], 'updated_at'>;
        Update: Partial<Database['public']['Tables']['streaks']['Insert']>;
        Relationships: [];
      };
      achievements_master: {
        Row: {
          id: string;
          code: string;
          name_ko: string;
          description: string | null;
          icon: string | null;
          condition_type: string;
          condition_data: Record<string, unknown> | null;
          rarity: AchievementRarity;
          is_hidden: boolean;
        };
        Insert: Omit<Database['public']['Tables']['achievements_master']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['achievements_master']['Insert']>;
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          unlock_session_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['user_achievements']['Row'], 'id' | 'unlocked_at'>;
        Update: Partial<Database['public']['Tables']['user_achievements']['Insert']>;
        Relationships: [];
      };
      interviewer_personas: {
        Row: {
          id: string;
          mode: InterviewMode;
          role: InterviewerRole;
          label_ko: string;
          position_ko: string | null;
          voice_id: string;
          voice_pitch: number;
          voice_speed: number;
          tone_description: string | null;
          character_data: Record<string, unknown> | null;
          avatar_url: string | null;
          greetings: string[] | null;
          positive_reactions: string[] | null;
          negative_reactions: string[] | null;
          follow_up_intros: string[] | null;
          closings: string[] | null;
          is_unlocked_by_default: boolean;
          unlock_condition: Record<string, unknown> | null;
        };
        Insert: Omit<Database['public']['Tables']['interviewer_personas']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['interviewer_personas']['Insert']>;
        Relationships: [];
      };
      daily_challenges: {
        Row: {
          id: string;
          user_id: string;
          challenge_date: string;
          question_ids: string[];
          completed_session_id: string | null;
          completed_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['daily_challenges']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['daily_challenges']['Insert']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
