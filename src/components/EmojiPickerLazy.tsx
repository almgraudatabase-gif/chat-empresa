import EmojiPicker, { Theme, type EmojiClickData } from 'emoji-picker-react';

interface Props {
  dark: boolean;
  onPick: (emoji: string) => void;
}

export default function EmojiPickerLazy({ dark, onPick }: Props) {
  return (
    <EmojiPicker
      theme={dark ? Theme.DARK : Theme.LIGHT}
      width="100%"
      height={340}
      lazyLoadEmojis
      searchPlaceholder="Buscar emoji"
      previewConfig={{ showPreview: false }}
      onEmojiClick={(d: EmojiClickData) => onPick(d.emoji)}
    />
  );
}
