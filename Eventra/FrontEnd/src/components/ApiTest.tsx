import React, { useState } from 'react';
import apiService from '../services/api';

const ApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testApiConnection = async () => {
    setIsLoading(true);
    setTestResults([]);
    
    try {
      // Test 1: Get venues
      addResult('Testing venues API...');
      const venuesResponse = await apiService.getVenues();
      addResult(`Venues API: ${venuesResponse.success ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 2: Get users
      addResult('Testing users API...');
      const usersResponse = await apiService.getUsers();
      addResult(`Users API: ${usersResponse.success ? 'SUCCESS' : 'FAILED'}`);
      
      // Test 3: Get bookings
      addResult('Testing bookings API...');
      const bookingsResponse = await apiService.getBookings();
      addResult(`Bookings API: ${bookingsResponse.success ? 'SUCCESS' : 'FAILED'}`);
      
      addResult('API tests completed!');
    } catch (error: any) {
      addResult(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">API Integration Test</h2>
      
      <button
        onClick={testApiConnection}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {isLoading ? 'Testing...' : 'Test API Connection'}
      </button>
      
      {testResults.length > 0 && (
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-bold mb-2">Test Results:</h3>
          {testResults.map((result, index) => (
            <div key={index} className="text-sm mb-1">
              {result}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiTest; 