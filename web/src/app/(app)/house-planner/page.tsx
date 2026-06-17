import { redirect } from 'next/navigation';

export default function HousePlannerPage() {
  redirect('/goals?tab=planners');
}
