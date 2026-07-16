export type RigConfigurationEmojis = {
  emojiLeft: string;
  emojiRight: string;
};

export type RigConfiguration = RigConfigurationEmojis & {
  id: number;
  index: number;
  createdAt: string;
};
