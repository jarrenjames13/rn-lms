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
  access_token?: string;
  refresh_token?: string;
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
  overall_progress: number | null;
  components: {
    sections: number | null;
    activities: number | null;
    quizzes: number;
    exams: number;
  };
  counts: {
    sections: number | string;
    activities: number | string;
    quizzes: number | string;
    exams: number | string;
  };
  enrolled_courses: number;
  courses: OverallLearningCourse[];
  instance_scope_available: boolean;
  non_scoped_progress: number | null;
}

export interface OverallLearningCourse {
  course_id: number;
  instance_id: number;
  all_sections_completed: boolean | null;
  all_assessments_completed: boolean;
  completed_sections: number | null;
  total_sections: number | null;
  pending_sections: number | null;
  completed_assessments: number;
  total_assessments: number;
  pending_assessments: number;
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
  overall_progress: number | null;
  components: {
    sections: {
      completed: number | null;
      total: number;
      percentage: number | null;
      available: boolean;
    };
    activities: {
      completed: number | null;
      total: number;
      percentage: number | null;
      available: boolean;
    };
    quizzes: {
      completed: number | null;
      total: number;
      percentage: number | null;
      available: boolean;
    };
    exams: {
      completed: number | null;
      total: number;
      percentage: number | null;
      available: boolean;
    };
  };
  instance_scope_available: boolean;
  non_scoped_progress: number | null;
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
  isParsing?: boolean;
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
    description: string | null;
    total_items: number;
    is_taken: boolean;
    attempts_made: number;
    last_attempted_at: string | null;
    score: number | null;
    completed_at: string | null;
    active_session?: ActiveAssessmentSession | null;
    locked?: boolean;
  }[];
  instance_id: number;
}

export interface ActiveAssessmentSession {
  session_id: number;
  started_at: string;
  deadline_at: string;
  remaining_seconds: number;
  lease_generation: number;
  state: "resumable" | "expired_pending";
  camera_required?: boolean;
  capture_state?: string;
}

export interface StudentExams {
  exams: ExamDetails[];
  instance_id: number;
}

export interface StudentAssessmentDetails {
  exam_id: number;
  exam_name: string;
  exam_period: string;
  description: string | null;
  total_items: number | null;
  category: string;
  submission_instruction: string | null;
  feedback: string | null;
  is_taken: boolean;
  score: number | null;
  completed_at: string | null;
  status?: string | null;
  review_status?: string | null;
  grade_status?: string | null;
  capture_state?: string;
  active_session?: ActiveAssessmentSession | null;
  ip_allowed?: boolean;
  locked?: boolean;
}

export interface ExamDetails extends StudentAssessmentDetails {
  max_attempts: number;
  attempts_made: number;
  remaining_attempts: number;
  can_attempt: boolean;
  camera_required?: boolean;
  review_status?: string | null;
  grade_status?: string | null;
}

export type StudentSubmission = StudentAssessmentDetails;

export interface StudentSubmissions {
  exams: StudentSubmission[];
  instance_id: number;
}

export interface QuizDetails {
  quiz_id: number;
  quiz_name: string;
  exam_period: string;
  description: string | null;
  total_items: number;
  is_taken: boolean;
  attempts_made: number;
  last_attempted_at: string | null;
  score: number | null;
  completed_at: string | null;
  active_session?: ActiveAssessmentSession | null;
  locked?: boolean;
}

export interface ExamRetryStatus {
  session_id: number;
  state: "ACTIVE" | "FINALIZING" | "COMPLETED";
  can_retry: boolean;
  code?: string;
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
  session_question_id?: number;
  question: string;
  options: Options;
  question_html?: string | null;
  options_html?: Partial<Options> | null;
  content_format_version?: number;
}

export interface QuestionsResponse {
  questions: Question[];
  saved_answers?: Record<number, OptionKey>;
  answer_versions?: Record<number, number>;
}

export interface ExamQuestion {
  question_number: number;
  item_id: number;
  session_question_id?: number;
  question_text: string;
  options: Options;
  question_html?: string | null;
  options_html?: Partial<Options> | null;
  content_format_version?: number;
}

export interface ExamQuestionsResponse {
  questions: ExamQuestion[];
  saved_answers?: Record<number, OptionKey>;
  answer_versions?: Record<number, number>;
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
  count: number | null;
  graded_count: number | null;
  average: number | null;
  highest: number | null;
  lowest: number | null;
  available: boolean;
}

export interface GradesSummary {
  activities: GradeSummary;
  quizzes: GradeSummary;
  exams: GradeSummary;
  submissions: GradeSummary;
}

export interface SubmissionGrade {
  exam_name: string;
  exam_period: string;
  score: number | null;
  status: string;
  submitted_at: string | null;
  graded_at: string | null;
  feedback: string | null;
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
  submission_grades: SubmissionGrade[];
  summary: GradesSummary;
  overall_grade: number;
  instance_scope_available: boolean;
}

export interface Replies {
  success: boolean;
  message: string;
  parent_id: number;
  page: number;
  per_page: number;
  total: number;
  replies: {
    id: number;
    comment: string;
    user_id: number;
    full_name: string;
    status: string;
    created_at: string;
    updated_at?: string;
    updated_by?: number;
    mentioned_user_id?: number;
    mentioned_user_name?: string;
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
