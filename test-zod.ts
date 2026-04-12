import { screenStyleSchema } from './packages/arlo-sdk/src/schema';

const data = {
  backgroundColor: '#FFFFFF',
  paddingLeft: 40,
  paddingRight: 40,
};

console.log(screenStyleSchema.parse(data));
