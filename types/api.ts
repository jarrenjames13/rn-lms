export interface LoginPayload {
  external_id: string;
  password: string;
}

interface LoginResponseSuccess {
  success: true;
  message: string;
  user: {
    user_id: number;
    external_id: string;
    full_name: string;
    role: string;
  };
  access_token: string;
  refresh_token: string;
}

interface LoginResponseError {
  success: false;
  detail: string;
}

export type LoginResponse = LoginResponseSuccess | LoginResponseError;

interface LogoutResponseSuccess {
  success: true;
  message: string;
}

interface GenericErrorResponse {
  success: false;
  detail: string;
}
export type LogoutResponse = LogoutResponseSuccess | GenericErrorResponse;

export interface VerifyUser {
  success: boolean;
  user: {
    user_id: number;
    external_id: string;
    full_name: string;
    role: string;
  };
}
export interface Enrollment {
  enrollment_id: number;
  created_at: string;
  course_id: number;
  course_title: string;
  description: string;
  term_code: string;
  start_date: string;
  end_date: string;
  instance_id: number;
}

export interface StatsData {
  overall_progress: number;
  components: {
    sections: number;
    activities: number;
    quizzes: number;
    exams: number;
  };
  counts: {
    sections: number;
    activities: number;
    quizzes: number;
    exams: number;
  };
  enrolled_courses: number;
}

export type CourseAllDetails = {
  course: {
    course_code: string;
    course_title: string;
    description: string;
  };
  modules: {
    module_id: number;
    position: number;
    content_html: string;
    learning_outcomes: string[];
    created_at: string;
    updated_at: string;
    sections: Section[];
  }[];
};

export type Section = {
  section_id: number;
  position: number;
  title: string;
  content: string;
};

export type ModuleData = {
  module_id: number;
  position: number;
  content_html: string;
  learning_outcomes: string[];
  created_at: string;
  updated_at: string;
  sections: Section[];
}[];

export type CourseDetails = {
  course_code: string;
  course_title: string;
  description: string;
};

export interface CourseQuickStats {
  modules: string;
  quizzes: string;
  exams: string;
  submissions: string;
  overall_grade: number;
}

export interface CourseProgress {
  overall_progress: number;
  components: {
    sections: {
      completed: number;
      total: number;
      percentage: number;
    };
    activities: {
      completed: number;
      total: number;
      percentage: number;
    };
    quizzes: {
      completed: number;
      total: number;
      percentage: number;
    };
    exams: {
      completed: number;
      total: number;
      percentage: number;
    };
  };
}

export interface Comment {
  success: boolean;
  message: string;
  page: number;
  per_page: number;
  total: number;
  comments: {
    id: number;
    comment: string;
    user_id: number;
    full_name: string;
    status: string;
    created_at: string;
    updated_at?: string;
    updated_by?: number;
    total_replies: number;
    file_path?: string;
    like: number;
    love: number;
    haha: number;
    sad: number;
    wow: number;
    dislike: number;
    total_reacts: number;
    user_reaction?: string;
  }[];
}

export interface ActivityWithGrade {
  activities: {
    activity_id: number;
    title: string;
    instructions: string;
    activity_type: string;
    position: number;
    submission_id: number | null;
    status: string | null;
    grade: number | null;
    feedback: string | null;
    submitted_at: string | null;
    is_graded: boolean;
    has_submission: boolean;
  }[];
}

export interface SingleActivity {
  activity_id: number;
  title: string;
  instructions: string;
  activity_type: string;
  position: number;
  submission_id: number | null;
  status: string | null;
  grade: number | null;
  feedback: string | null;
  submitted_at: string | null;
  is_graded: boolean;
  has_submission: boolean;
}

export interface ModuleProgress {
  module_id: number;
  total_sections: number;
  completed_sections: number;
  sections_percentage: number;
  total_activities: number;
  submitted_activities: number;
  activities_percentage: number;
  overall_percentage: number;
}

export interface Module {
  module_id: number;
  position: number;
  content_html: string;
  learning_outcomes: string[];
  created_at: string;
  updated_at: string;
  sections: Section[];
}
export interface ParsedModule extends Module {
  parsedTitle: string;
  parsedDescription: string;
  progress: ModuleProgress | null;
  activities: SingleActivity[];
  isLoadingActivities: boolean;
  activitiesError: boolean;
}

export interface StudentQuizzes {
  quizzes: {
    quiz_id: number;
    quiz_name: string;
    exam_period: string;
    description: string;
    total_items: number;
    is_taken: boolean;
    attempts_made: number;
    last_attempted_at: string | null;
    score: number | null;
    completed_at: string | null;
  }[];
  instance_id: number;
}

export interface StudentExams {
  exams: {
    exam_id: number;
    exam_name: string;
    exam_period: string;
    description: string;
    total_items: number;
    category: string;
    submission_instruction: string;
    is_taken: boolean;
    score: number | null;
    completed_at: string | null;
    status: string;
  }[];
  instance_id: number;
}

export interface ExamDetails {
  exam_id: number;
  exam_name: string;
  exam_period: string;
  description: string;
  total_items: number;
  category: string;
  submission_instruction: string;
  is_taken: boolean;
  score: number | null;
  completed_at: string | null;
  status: string;
}

export interface QuizDetails {
  quiz_id: number;
  quiz_name: string;
  exam_period: string;
  description: string;
  total_items: number;
  is_taken: boolean;
  attempts_made: number;
  last_attempted_at: string | null;
  score: number | null;
  completed_at: string | null;
}

// Strict option keys
export type OptionKey = "A" | "B" | "C" | "D";

export interface Options {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface Question {
  question_number: number;
  item_id: number;
  question: string;
  options: Options;
}

export interface QuestionsResponse {
  questions: Question[];
}

export interface ExamQuestion {
  question_number: number;
  item_id: number;
  question_text: string;
  options: Options;
}

export interface ExamQuestionsResponse {
  questions: ExamQuestion[];
}

export interface ActivityGrade {
  activity_title: string;
  module_position: number;
  activity_position: number;
  grade?: number;
  status: string;
  submitted_at?: string;
  feedback?: string;
  activity_type: string;
}

export interface QuizGrade {
  exam_name: string;
  exam_period: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  completed_at: string | null;
}

export interface ExamGrade {
  exam_name: string;
  exam_period: string;
  score: number;
  total_questions: number;
  correct_answers: number;
  completed_at: string | null;
  submission_reason?: string;
}

export interface GradeSummary {
  count: number;
  graded_count: number;
  average: number;
  highest: number;
  lowest: number;
}

export interface GradesSummary {
  activities: GradeSummary;
  quizzes: GradeSummary;
  exams: GradeSummary;
}
export interface CourseInfo {
  course_code: string;
  course_title: string;
}
export interface ComprehensiveGradesResponse {
  course_info: CourseInfo;
  activity_grades: ActivityGrade[];
  quiz_grades: QuizGrade[];
  exam_grades: ExamGrade[];
  summary: GradesSummary;
  overall_grade: number;
}
