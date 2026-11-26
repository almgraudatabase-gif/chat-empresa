import { cx, initials } from '../utils/format';
import { Icon } from './Icon';

interface AvatarProps {
  name: string;
  photoURL?: string;
  size?: number;
  group?: boolean;
  online?: boolean;
  className?: string;
}

const COLORS = ['bg-teal-600', 'bg-sky-600', 'bg-violet-600', 'bg-rose-600', 'bg-amber-600', 'bg-emerald-600', 'bg-indigo-600'];

export function Avatar({ name, photoURL, size = 48, group = false, online = false, className }: AvatarProps) {
  const color = COLORS[(name.charCodeAt(0) || 0) % COLORS.length];
  return (
    <div className={cx('relative shrink-0', className)} style={{ width: size, height: size }}>
      {photoURL ? (
        <img src={photoURL} alt={name} loading="lazy" className="h-full w-full rounded-full object-cover" />
      ) : (
        <div className={cx('flex h-full w-full items-center justify-center rounded-full font-medium text-white', color)} style={{ fontSize: size / 2.6 }}>
          {group ? <Icon name="users" className="h-1/2 w-1/2" /> : initials(name)}
        </div>
      )}
      {online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-brand dark:border-panel-dark" />}
    </div>
  );
}
