export type ArmsPositionEmojis = {
  emojiLeft: string;
  emojiRight: string;
};

export type ArmsPosition = ArmsPositionEmojis & {
  id: number;
  index: number;
  createdAt: string;
};

