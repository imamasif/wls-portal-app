export const getEmbeddableDriveUrl = (url) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    return url.replace(/\/view.*$/, '/preview').replace(/\/edit.*$/, '/preview');
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : url;
  }
  return url;
};