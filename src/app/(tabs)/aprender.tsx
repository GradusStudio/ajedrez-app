import React from 'react';
import { router } from 'expo-router';
import { HomeScreen } from '../../screens/HomeScreen';

export default function LearnTab() {
  return (
    <HomeScreen
      onStartLesson={(lesson) => router.push({ pathname: '/leccion/[id]', params: { id: lesson.id } })}
      onOpenUnitTest={(unit) => router.push({ pathname: '/prueba-unidad', params: { unit: String(unit) } })}
    />
  );
}
