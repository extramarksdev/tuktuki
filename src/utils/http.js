export const httpGet = async (url, headers = {}) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const httpPost = async (url, body, headers = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const createBasicAuthHeader = (username, password) => {
  const credentials = btoa(`${username}:${password}`);
  return { Authorization: `Basic ${credentials}` };
};

export const createBearerAuthHeader = (token) => {
  return { Authorization: `Bearer ${token}` };
};

