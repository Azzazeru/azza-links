import app from './app';

import { PORT } from './config';

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log('Server is running on port ' + PORT);
});
