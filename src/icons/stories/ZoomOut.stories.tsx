import { Meta, Story } from '@storybook/react';
import React from 'react';

import ZoomOut from '../ZoomOut';

const PROPS: React.SVGAttributes<SVGElement> = {};

export default {
  title: 'components/Icons/ZoomOut',
  component: ZoomOut,
} as Meta;

const Template: Story<React.SVGAttributes<SVGElement>> = (args) => <ZoomOut {...args} />;

export const Default = Template.bind({});
Default.args = PROPS;
