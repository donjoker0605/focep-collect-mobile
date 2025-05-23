import { render, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../screens/Collecteur/DashboardScreen';

test('Dashboard loads without crashing', async () => {
  const { getByText } = render();
  
  await waitFor(() => {
    expect(getByText('Tableau de bord')).toBeTruthy();
  });
});