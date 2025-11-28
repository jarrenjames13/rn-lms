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
    sections: {
      section_id: number;
      position: number;
      title: string;
      content: string;
    }[];
  }[];
};

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
