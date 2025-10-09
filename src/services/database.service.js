export const fetchEpisodeViews = async () => {
  try {
    const url = 'YOUR_DATABASE_API_ENDPOINT/episode-views';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      totalViews: data.totalViews || 0,
    };
  } catch (error) {
    console.error('Error fetching episode views:', error);
    throw error;
  }
};

