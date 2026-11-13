import React from 'react';
import { router } from 'expo-router';
import { WideListColumn } from '../../components/WideListColumn';
import { WIDE_GRID_COLUMN } from '../../components/wideLayout';
import { OpeningsScreen } from '../../screens/OpeningsScreen';

export default function OpeningsTab() {
  return (
    <WideListColumn width={WIDE_GRID_COLUMN}>
      <OpeningsScreen onOpenCourse={(course) => router.push({ pathname: '/apertura/[id]', params: { id: course.id } })} />
    </WideListColumn>
  );
}
