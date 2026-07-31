/** 题即作者名时（如击壤歌）不重复展示作者。 */
export function shouldHidePoemAuthor(poem: {
  author: string;
  title: string;
}): boolean {
  return poem.author === poem.title;
}
