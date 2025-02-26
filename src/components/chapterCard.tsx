'use client';
import { cn } from '@/lib/utils';
import { Chapters } from '@prisma/client';
import React from 'react';

type Props = {
  chapter: Chapters;
  chapterIndex: number;
};

const ChapterCard = ({ chapter, chapterIndex }: Props) => {
  const [success, setSuccess] = React.useState<boolean | null>(null);

  return (
    <div
      key={chapter.id}
      className={cn('px-4 py-2 mt-2 rounded flex justify-between', {
        'bg-secondary': success === null,
        'bg-green-500': success === true,
        'bg-red-500': success === false,
      })}
    >
      <h5>{chapter.name}</h5>
    </div>
  );
};

ChapterCard.displayName = 'ChapterCard';

export default ChapterCard;
