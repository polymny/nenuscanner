/**
 * Adapted from react-drag-card (MIT):
 * https://github.com/nishansanjuka/react-drag-card/blob/main/components/dragble-wrapper.tsx
 */
import { ChevronUp, Maximize, Minimize } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode, PointerEvent as ReactPointerEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type DraggableWrapperProps = {
  children: ReactNode;
  title?: string;
  className?: string;
  defaultPosition?: { x: number; y: number };
  /** Anchor bottom-right on first layout when no saved/default position. */
  defaultAnchor?: 'bottom-right' | 'none';
  storageKey?: string;
  onPositionChange?: (position: { x: number; y: number }) => void;
  onFullScreenChange?: (isFullScreen: boolean) => void;
  onMinimizeChange?: (isMinimized: boolean) => void;
  width?: string;
  height?: string;
  fullScreenWidth?: string;
  fullScreenHeight?: string;
  maximizeButton?: ReactNode;
  minimizeButton?: ReactNode;
  restoreButton?: ReactNode;
  headerContent?: ReactNode;
  /** Extra controls rendered before minimize/maximize (e.g. close). */
  headerActions?: ReactNode;
};

type ResizeHandle = 's' | 'e' | 'w' | 'se' | 'sw' | null;

type PersistedState = {
  position: { x: number; y: number };
  size: { width?: number; height?: number };
  isMinimized: boolean;
};

const VIEWPORT_MARGIN = 16;
const BOTTOM_OFFSET = 88;

function readPersisted(storageKey: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function writePersisted(storageKey: string, state: PersistedState) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function bottomRightPosition(size: { width?: number; height?: number }) {
  const width = size.width ?? 384;
  const height = size.height ?? 280;
  return {
    x: Math.max(VIEWPORT_MARGIN, window.innerWidth - width - VIEWPORT_MARGIN),
    y: Math.max(VIEWPORT_MARGIN, window.innerHeight - height - BOTTOM_OFFSET),
  };
}

const DraggableWrapper = ({
  children,
  title,
  className = '',
  defaultPosition = { x: 0, y: 0 },
  defaultAnchor = 'none',
  storageKey,
  onPositionChange,
  onFullScreenChange,
  onMinimizeChange,
  width = 'w-64',
  height = 'auto',
  fullScreenWidth = '100%',
  fullScreenHeight = '100%',
  headerContent,
  headerActions,
  maximizeButton = <Maximize size={20} />,
  minimizeButton = <Minimize size={20} />,
  restoreButton = (
    <Button className="max-w-sm cursor-pointer justify-start!" type="button" variant="outline">
      <span className="truncate">Restore {title}</span>
      <ChevronUp className="" />
    </Button>
  ),
}: DraggableWrapperProps) => {
  const persisted = storageKey ? readPersisted(storageKey) : null;

  const [position, setPosition] = useState(persisted?.position ?? defaultPosition);
  const [lastPosition, setLastPosition] = useState(persisted?.position ?? defaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<ResizeHandle>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(persisted?.isMinimized ?? false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [customSize, setCustomSize] = useState<{ width?: number; height?: number }>(persisted?.size ?? { width: 384 });
  const [hasAnchored, setHasAnchored] = useState(
    Boolean(persisted?.position ?? (defaultPosition.x !== 0 || defaultPosition.y !== 0))
  );
  const cardRef = useRef<HTMLDivElement>(null);

  const persistState = useCallback(
    (patch: Partial<PersistedState>) => {
      if (!storageKey) return;
      writePersisted(storageKey, {
        position,
        size: customSize,
        isMinimized,
        ...patch,
      });
    },
    [storageKey, position, customSize, isMinimized]
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (cardRef.current && !isFullScreen && !isMinimized) {
        const cardRect = cardRef.current.getBoundingClientRect();
        const startX = e.clientX - position.x;
        const startY = e.clientY - position.y;

        const onPointerMove = (moveEvent: PointerEvent) => {
          let newX = moveEvent.clientX - startX;
          let newY = moveEvent.clientY - startY;

          newX = Math.max(0, Math.min(newX, viewportSize.width - cardRect.width));
          newY = Math.max(0, Math.min(newY, viewportSize.height - cardRect.height));

          const newPosition = { x: newX, y: newY };
          setPosition(newPosition);
          setLastPosition(newPosition);
          onPositionChange?.(newPosition);
          persistState({ position: newPosition });
        };

        const onPointerUp = () => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          setIsDragging(false);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        setIsDragging(true);
      }
    },
    [position, isFullScreen, isMinimized, viewportSize, onPositionChange, persistState]
  );

  const startResize = useCallback(
    (e: ReactPointerEvent, handle: ResizeHandle) => {
      if (!isFullScreen && !isMinimized && cardRef.current) {
        e.stopPropagation();
        const startX = e.clientX;
        const startY = e.clientY;
        const rect = cardRef.current.getBoundingClientRect();
        const startWidth = rect.width;
        const startHeight = rect.height;
        const startPosition = { ...position };

        const onPointerMove = (moveEvent: PointerEvent) => {
          const deltaX = moveEvent.clientX - startX;
          const deltaY = moveEvent.clientY - startY;
          let newWidth = startWidth;
          let newHeight = startHeight;
          let newX = startPosition.x;
          let newY = startPosition.y;

          switch (handle) {
            case 'e':
              newWidth = Math.max(200, startWidth + deltaX);
              break;
            case 'w':
              newWidth = Math.max(200, startWidth - deltaX);
              newX = startPosition.x + startWidth - newWidth;
              break;
            case 's':
              newHeight = Math.max(100, startHeight + deltaY);
              break;
            case 'se':
              newWidth = Math.max(200, startWidth + deltaX);
              newHeight = Math.max(100, startHeight + deltaY);
              break;
            case 'sw':
              newWidth = Math.max(200, startWidth - deltaX);
              newHeight = Math.max(100, startHeight + deltaY);
              newX = startPosition.x + startWidth - newWidth;
              break;
          }

          if (newX < 0) {
            newWidth += newX;
            newX = 0;
          }
          if (newY < 0) {
            newHeight += newY;
            newY = 0;
          }
          if (newX + newWidth > viewportSize.width) {
            newWidth = viewportSize.width - newX;
          }
          if (newY + newHeight > viewportSize.height) {
            newHeight = viewportSize.height - newY;
          }

          const nextSize = { width: newWidth, height: newHeight };
          const nextPosition = { x: newX, y: newY };
          setCustomSize(nextSize);
          setPosition(nextPosition);
          onPositionChange?.(nextPosition);
          persistState({ size: nextSize, position: nextPosition });
        };

        const onPointerUp = () => {
          document.removeEventListener('pointermove', onPointerMove);
          document.removeEventListener('pointerup', onPointerUp);
          setIsResizing(null);
        };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        setIsResizing(handle);
      }
    },
    [isFullScreen, isMinimized, onPositionChange, position, viewportSize.width, viewportSize.height, persistState]
  );

  const toggleFullScreen = useCallback(() => {
    if (isMinimized) {
      setIsMinimized(false);
      onMinimizeChange?.(false);
      persistState({ isMinimized: false });
    } else {
      if (!isFullScreen) {
        setLastPosition(position);
      } else {
        setPosition(lastPosition);
        onPositionChange?.(lastPosition);
        persistState({ position: lastPosition });
      }
      setIsFullScreen(!isFullScreen);
      onFullScreenChange?.(!isFullScreen);
    }
  }, [
    isFullScreen,
    isMinimized,
    lastPosition,
    position,
    onFullScreenChange,
    onMinimizeChange,
    onPositionChange,
    persistState,
  ]);

  const toggleMinimize = useCallback(() => {
    if (isFullScreen) {
      setIsFullScreen(false);
      setPosition(lastPosition);
      onPositionChange?.(lastPosition);
      onFullScreenChange?.(false);
      persistState({ position: lastPosition });
    }
    const next = !isMinimized;
    setIsMinimized(next);
    onMinimizeChange?.(next);
    persistState({ isMinimized: next });
  }, [isFullScreen, isMinimized, lastPosition, onFullScreenChange, onMinimizeChange, onPositionChange, persistState]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        toggleFullScreen();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullScreen, toggleFullScreen]);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  useEffect(() => {
    if (hasAnchored || defaultAnchor !== 'bottom-right' || viewportSize.width === 0 || persisted?.position) {
      return;
    }
    const anchored = bottomRightPosition(customSize);
    setPosition(anchored);
    setLastPosition(anchored);
    setHasAnchored(true);
    persistState({ position: anchored });
  }, [
    hasAnchored,
    defaultAnchor,
    viewportSize.width,
    viewportSize.height,
    customSize,
    persisted?.position,
    persistState,
  ]);

  const renderHeader = () => {
    if (headerContent) {
      return headerContent;
    }

    return (
      <CardHeader className="flex flex-row items-center justify-between space-x-2 p-0 px-6">
        {title && <CardTitle className="translate-y-1 truncate text-base">{title}</CardTitle>}
        <div className="flex items-center space-x-2">
          {headerActions}
          {minimizeButton && <div onClick={toggleMinimize}>{minimizeButton}</div>}
          {maximizeButton && <div onClick={toggleFullScreen}>{maximizeButton}</div>}
        </div>
      </CardHeader>
    );
  };

  const resizeHandles = [
    { handle: 's', className: 'absolute right-0 bottom-0 left-0 h-1 cursor-s-resize' },
    { handle: 'e', className: 'absolute top-0 right-0 bottom-0 w-1 cursor-e-resize' },
    { handle: 'w', className: 'absolute top-0 bottom-0 left-0 w-1 cursor-w-resize' },
    { handle: 'se', className: 'absolute right-0 bottom-0 h-2 w-2 cursor-se-resize' },
    { handle: 'sw', className: 'absolute bottom-0 left-0 h-2 w-2 cursor-sw-resize' },
  ];

  return (
    <div>
      <div
        ref={cardRef}
        style={{
          position: 'fixed',
          left: isFullScreen ? 0 : `${position.x}px`,
          top: isFullScreen ? 0 : `${position.y}px`,
          width: isFullScreen ? fullScreenWidth : customSize.width ? `${customSize.width}px` : 'auto',
          height: isFullScreen ? fullScreenHeight : customSize.height ? `${customSize.height}px` : height,
          padding: '10px',
          touchAction: 'none',
          display: isMinimized ? 'none' : 'block',
          zIndex: 60,
        }}
      >
        <Card
          className={cn(
            'transition-shadow select-none',
            (isDragging || isResizing) && !isFullScreen && 'shadow-lg',
            isFullScreen ? 'h-full w-full' : width,
            className
          )}
        >
          <div className="cursor-move" onPointerDown={onPointerDown}>
            {renderHeader()}
          </div>
          <CardContent className="relative mt-2 min-h-0 flex-1">
            {children}
            {!isFullScreen &&
              !isMinimized &&
              resizeHandles.map(({ handle, className: handleClassName }) => (
                <div
                  className={cn('bg-transparent hover:bg-gray-200', handleClassName)}
                  key={handle}
                  onPointerDown={(e) => startResize(e, handle as ResizeHandle)}
                />
              ))}
          </CardContent>
        </Card>
      </div>

      {isMinimized && (
        <div className="fixed right-4 bottom-4 z-60">
          {restoreButton && (
            <div
              onClick={() => {
                setIsMinimized(false);
                onMinimizeChange?.(false);
                persistState({ isMinimized: false });
              }}
            >
              {restoreButton}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DraggableWrapper;
export { DraggableWrapper };
