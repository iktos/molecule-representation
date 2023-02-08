import { Meta, Story } from '@storybook/react';
import React from 'react';

import ZoomIn from '../ZoomIn';

const PROPS: React.SVGAttributes<SVGElement> = {};

export default {
  title: 'components/Icons/ZoomIn',
  component: ZoomIn,
} as Meta;

const Template: Story<React.SVGAttributes<SVGElement>> = (args) => <ZoomIn {...args} />;

export const Default = Template.bind({});
Default.args = PROPS;
