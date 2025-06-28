export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const postId = getRouterParam(event, "id");

  // Check if required environment variables are set
  if (!config.beehiivApiKey || !config.public.beehiivPublicationId) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "Newsletter configuration missing. Please check environment variables.",
    });
  }

  if (!postId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Post ID is required",
    });
  }

  try {
    const response = await $fetch(
      `https://api.beehiiv.com/v2/publications/${config.public.beehiivPublicationId}/posts/${postId}`,
      {
        headers: {
          Authorization: `Bearer ${config.beehiivApiKey}`,
          "Content-Type": "application/json",
        },
        query: {
          expand: "free_web_content",
          status: "confirmed", // Only fetch published posts
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Error fetching Beehiiv post:", error);

    // Return more specific error messages
    if (error.response?.status === 401) {
      throw createError({
        statusCode: 401,
        statusMessage: "Invalid Beehiiv API credentials",
      });
    } else if (error.response?.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: "Post not found",
      });
    }

    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch newsletter post",
    });
  }
});
