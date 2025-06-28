export const useBeehiiv = () => {
  const fetchPosts = async () => {
    try {
      const response = await $fetch("/api/newsletter/posts");
      return response;
    } catch (error) {
      console.error("Error fetching Beehiiv posts:", error);
      throw error;
    }
  };

  const fetchPost = async (postId) => {
    try {
      const response = await $fetch(`/api/newsletter/posts/${postId}`);
      return response;
    } catch (error) {
      console.error("Error fetching Beehiiv post:", error);
      throw error;
    }
  };

  const formatDate = (unixTimestamp) => {
    if (!unixTimestamp) return "";
    // Convert Unix timestamp (seconds) to milliseconds for JavaScript Date
    const date = new Date(unixTimestamp * 1000);
    return new Intl.DateTimeFormat("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const formatDateForDatetime = (unixTimestamp) => {
    if (!unixTimestamp) return "";
    // Convert Unix timestamp to ISO string for datetime attribute
    const date = new Date(unixTimestamp * 1000);
    return date.toISOString();
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return "";
    const textContent = content.replace(/<[^>]*>/g, ""); // Remove HTML tags
    return textContent.length > maxLength
      ? textContent.substring(0, maxLength) + "..."
      : textContent;
  };

  return {
    fetchPosts,
    fetchPost,
    formatDate,
    formatDateForDatetime,
    truncateContent,
  };
};
