import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from './App.jsx';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './redux/store';

const theme = createTheme({
  palette: {
    primary: { main: '#7a1f3d', dark: '#5a1530', contrastText: '#ffffff' },
    secondary: { main: '#e87ca3', contrastText: '#1a1a1a' },
    background: { default: '#fff5f8' },
    text: { primary: '#1a1a1a' },
  },
});

createRoot(document.getElementById('root')).render(

  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </Provider>
);
