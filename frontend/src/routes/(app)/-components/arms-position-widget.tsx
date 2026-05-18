import { useState } from 'react';
import IncreaseArmsPositionDialog from './increase-arms-position-dialog';
import { useGetLastArmsPosition } from '@/api/queries/arms-position.queries';

const ArmsPositionWidget = () => {
  const { data: armsPosition } = useGetLastArmsPosition();
  const [openIncreaseArmsPositionDialog, setOpenIncreaseArmsPositionDialog] = useState(false);
  return (
    <div className="flex min-h-[32px] items-center rounded-lg">
      <div className="flex h-full min-w-[70px] items-center justify-center gap-1 rounded-l-lg bg-gray-200 p-1 text-lg">
        <span>{armsPosition?.emojiLeft}</span>
        <span>{armsPosition?.emojiRight}</span>
      </div>
      <button
        onClick={() => setOpenIncreaseArmsPositionDialog(true)}
        className="h-full rounded-r-lg bg-red-900 p-1 px-3 py-1 text-sm font-medium text-gray-200 transition-all duration-200 hover:bg-red-800"
      >
        J'ai bougé les bras
      </button>
      <IncreaseArmsPositionDialog open={openIncreaseArmsPositionDialog} setOpen={setOpenIncreaseArmsPositionDialog} />
    </div>
  );
};

export default ArmsPositionWidget;
