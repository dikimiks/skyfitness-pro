
import type { Course, Workout, User, LoginResponse } from '../types/api';

export const useApi = () => {
  const AUTH_BASE_URL = 'https://wedev-api.sky.pro';
  const API_BASE_URL = 'https://wedev-api.sky.pro/api/fitness';

  const getApiError = async (response: Response, fallback: string): Promise<Error> => {
    const body = await response.text();

    if (body) {
      try {
        const payload: unknown = JSON.parse(body);

        if (typeof payload === 'object' && payload !== null) {
          if (
            'message' in payload &&
            typeof payload.message === 'string' &&
            payload.message.length > 0
          ) {
            return new Error(payload.message);
          }

          if (
            'error' in payload &&
            typeof payload.error === 'string' &&
            payload.error.length > 0
          ) {
            return new Error(payload.error);
          }
        }
      } catch (err: unknown) {
        if (!(err instanceof SyntaxError)) throw err;
      }
    }

    return new Error(`${fallback} (HTTP ${response.status})`);
  };

  // === АВТОРИЗАЦИЯ ===
  const register = async (email: string, password: string) => {
    const response = await fetch(`${AUTH_BASE_URL}/api/fitness/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка регистрации');
    }

    return response.json();
  };

  const login = async (email: string, password: string) => {
    const response = await fetch(`${AUTH_BASE_URL}/api/fitness/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка входа');
    }

    const data: LoginResponse = await response.json();
    return data.token;
  };

  // === КУРСЫ ===
  const getCourses = async (): Promise<Course[]> => {
    const response = await fetch(`${API_BASE_URL}/courses`);

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка загрузки курсов');
    }

    return response.json();
  };

  const getCourseById = async (id: string): Promise<Course> => {
    const response = await fetch(`${API_BASE_URL}/courses/${id}`);

    if (!response.ok) {
      throw await getApiError(response, 'Курс не найден');
    }

    return response.json();
  };

  const getCourseWorkouts = async (courseId: string, token: string): Promise<Workout[]> => {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/workouts`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка загрузки тренировок');
    }

    return response.json();
  };

  // === ПОЛЬЗОВАТЕЛЬ ===
  const getMe = async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка загрузки профиля');
    }

    const data = await response.json();
    return data.user || data;
  };

  const addCourse = async (courseId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/me/courses`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ courseId }),
    });

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка добавления курса');
    }

    return response.json();
  };

  const deleteCourse = async (courseId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/me/courses/${courseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка удаления курса');
    }

    return response.json();
  };

  // === ПРОГРЕСС ===
  const getProgress = async (courseId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/me/progress?courseId=${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка загрузки прогресса');
    }

    return response.json();
  };

  const getWorkoutProgress = async (courseId: string, workoutId: string, token: string) => {
    const response = await fetch(
      `${API_BASE_URL}/users/me/progress?courseId=${courseId}&workoutId=${workoutId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка загрузки прогресса тренировки');
    }

    return response.json();
  };

  const updateProgress = async (
    courseId: string,
    workoutId: string,
    progressData: number[],
    token: string
  ) => {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/workouts/${workoutId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ progressData }),
    });

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка обновления прогресса');
    }

    return response.json();
  };

  const resetCourseProgress = async (courseId: string, token: string) => {
    const response = await fetch(`${API_BASE_URL}/courses/${courseId}/reset`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw await getApiError(response, 'Ошибка сброса прогресса курса');
    }

    return response.json();
  };

  return {
    register,
    login,
    getCourses,
    getCourseById,
    getCourseWorkouts,
    getMe,
    addCourse,
    deleteCourse,
    getProgress,
    getWorkoutProgress,
    updateProgress,
    resetCourseProgress,
  };
};