import { MainMenu } from '../components/MainMenu';

interface MainMenuPageProps {
  username: string;
  usernameError?: string;
  onUsernameChange: (value: string) => void;
  onCreateRoom: () => void;
  onQuickMatch: () => void;
  onFindRoom: () => void;
}

export function MainMenuPage({
  username,
  usernameError,
  onUsernameChange,
  onCreateRoom,
  onQuickMatch,
  onFindRoom,
}: MainMenuPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <MainMenu
        username={username}
        usernameError={usernameError}
        onUsernameChange={onUsernameChange}
        onCreateRoom={onCreateRoom}
        onQuickMatch={onQuickMatch}
        onFindRoom={onFindRoom}
      />
    </div>
  );
}
