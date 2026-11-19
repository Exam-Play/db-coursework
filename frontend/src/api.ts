const BASE_URL = 'http://localhost:8000';

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
	const token = localStorage.getItem('token');
	const headers = {
		'Content-Type': 'application/json',
		...(token ? { 'Authorization': `Bearer ${token}` } : {}),
		...options.headers,
	};

	const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'Ошибка сервера' }));
		throw new Error(error.detail || 'Ошибка запроса');
	}

	return response.json();
}
