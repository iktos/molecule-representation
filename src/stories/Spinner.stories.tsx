import { Meta, Story } from '@storybook/react';
import React from 'react';
import { Spinner, SpinnerProps } from '../components/Spinner/Spinner.component';

export default {
  title: 'components/Spinner',
  component: Spinner,
} as Meta;

const Template: Story<SpinnerProps> = (args) => <Spinner {...args} />;

export const Default = Template.bind({});
Default.args = { width: 400, height: 400 };
