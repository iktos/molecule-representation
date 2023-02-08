import { Meta, Story } from '@storybook/react';
import React from 'react';

import ZoomReset from '../ZoomReset';

const PROPS: React.SVGAttributes<SVGElement> = {};

export default {
  title: 'components/Icons/ZoomReset',
  component: ZoomReset,
} as Meta;

const Template: Story<React.SVGAttributes<SVGElement>> = (args) => <ZoomReset {...args} />;

export const Default = Template.bind({});
Default.args = PROPS;
