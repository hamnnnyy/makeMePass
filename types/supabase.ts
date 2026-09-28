export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type InterviewMode = 'realistic' | 'casual' | 'boss' | 'cute';
export type InterviewerRole = 'hr' | 'tech' | 'exec';
export type SessionStatus = 'in_progress' | 'completed' | 'eliminated' | 'aborted';
export type SessionResult = 'pending' | 'pass' | 'fail_veto' | 'fail_eliminate';
export type VideoRetention = 'immediate_delete' | 'seven_days' | 'forever';
export type QuestionCategory = 'personality' | 'job_competency' | 'values_ethics' | 'experience' | 'motivation';

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
          equipped_achievement_id: string | null;  // migrations/20260928000000_equipped_title.sql
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
          interview_type: 'general' | 'personality' | 'job' | 'executive' | 'pt' | 'group' | 'debate' | 'discussion';  // migrations/20260928010000, 20260928020000
          group_setup: { topic: string; userSide?: string; peerSide?: string } | null;  // 토론·토의 주제와 편
          started_at: string;
          ended_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['interview_sessions']['Row'], 'id' | 'started_at' | 'interview_type' | 'group_setup'> & { interview_type?: Database['public']['Tables']['interview_sessions']['Row']['interview_type']; group_setup?: Database['public']['Tables']['interview_sessions']['Row']['group_setup'] };
        Update: Partial<Database['public']['Tables']['interview_sessions']['Insert']>;
        Relationships: [
          { foreignKeyName: 'interview_sessions_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'interview_sessions_cover_letter_id_fkey'; columns: ['cover_letter_id']; isOneToOne: false; referencedRelation: 'cover_letters'; referencedColumns: ['id'] },
          { foreignKeyName: 'interview_sessions_elimination_question_id_fkey'; columns: ['elimination_question_id']; isOneToOne: false; referencedRelation: 'questions'; referencedColumns: ['id'] },
        ];
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
          peer_turns: { peer: 'p1' | 'p2'; intent: string; text?: string }[] | null;  // AI 지원자 발언 (다대다·토론·토의)
          asked_at: string;
          answered_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['session_questions']['Row'], 'id' | 'asked_at' | 'peer_turns'> & { peer_turns?: Database['public']['Tables']['session_questions']['Row']['peer_turns'] };
        Update: Partial<Database['public']['Tables']['session_questions']['Insert']>;
        Relationships: [];
      };
      question_organizations: {
        Row: {
          question_id: string;
          organization_id: string;
          weight: number | null;
        };
        Insert: Database['public']['Tables']['question_organizations']['Row'];
        Update: Partial<Database['public']['Tables']['question_organizations']['Row']>;
        Relationships: [
          { foreignKeyName: 'question_organizations_question_id_fkey'; columns: ['question_id']; isOneToOne: false; referencedRelation: 'questions'; referencedColumns: ['id'] },
          { foreignKeyName: 'question_organizations_organization_id_fkey'; columns: ['organization_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
        ];
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
        Relationships: [
          { foreignKeyName: 'user_achievements_achievement_id_fkey'; columns: ['achievement_id']; isOneToOne: false; referencedRelation: 'achievements_master'; referencedColumns: ['id'] },
        ];
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
      user_unlocked_personas: {
        Row: {
          user_id: string;
          persona_id: string;
          unlocked_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_unlocked_personas']['Row'], 'unlocked_at'>;
        Update: Partial<Database['public']['Tables']['user_unlocked_personas']['Insert']>;
        Relationships: [
          { foreignKeyName: 'user_unlocked_personas_persona_id_fkey'; columns: ['persona_id']; isOneToOne: false; referencedRelation: 'interviewer_personas'; referencedColumns: ['id'] },
        ];
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
