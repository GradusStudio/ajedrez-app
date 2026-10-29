import React from 'react';
import { router } from 'expo-router';
import { OpeningsScreen } from '../../screens/OpeningsScreen';

export default function OpeningsTab() {
  return (
    <OpeningsScreen onOpenCourse={(course) => router.push({ pathname: '/apertura/[id]', params: { id: course.id } })} />
  );
}
