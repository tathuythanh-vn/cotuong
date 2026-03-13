import { MainMenu } from '../components/MainMenu';

interface MainMenuPageProps {
  onCreateRoom: () => void;
  onQuickMatch: () => void;
  onFindRoom: () => void;
}

export function MainMenuPage({
  onCreateRoom,
  onQuickMatch,
  onFindRoom,
}: MainMenuPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <MainMenu
        onCreateRoom={onCreateRoom}
        onQuickMatch={onQuickMatch}
        onFindRoom={onFindRoom}
      />
    </div>
  );
}
