import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView } from 'react-native';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Label,
  Textarea,
  Switch,
  RadioGroup,
  Avatar,
  Separator,
  Progress,
  Form,
  FormField,
  FormMessage,
  Toast,
  Toaster,
  useToast,
} from '../shared/components/ui';
import { theme } from '../shared/lib/theme';
import tw from 'twrnc';

export default function UIComponentsTestPage() {
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [switchValue, setSwitchValue] = useState(false);
  const [radioValue, setRadioValue] = useState('option1');
  const [progressValue, setProgressValue] = useState(30);
  
  const { toasts, toast, dismiss } = useToast();

  const radioOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const showToast = (variant: 'default' | 'destructive' | 'success' | 'warning') => {
    toast({
      title: `${variant.charAt(0).toUpperCase() + variant.slice(1)} Toast`,
      description: `This is a ${variant} toast message`,
      variant,
      duration: 3000,
    });
  };

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={tw`flex-1 p-4`}>
        <Text style={[tw`text-2xl font-bold mb-6`, { color: theme.colors.foreground }]}>
          UI Components Test
        </Text>

        {/* Toast Buttons */}
        <Card style={tw`mb-4`}>
          <CardHeader>
            <CardTitle>Toast System</CardTitle>
            <CardDescription>Test different types of toast notifications</CardDescription>
          </CardHeader>
          <CardContent style={tw`space-y-2`}>
            <Button onPress={() => showToast('default')} style={tw`mb-2`}>
              Show Default Toast
            </Button>
            <Button onPress={() => showToast('success')} style={tw`mb-2`}>
              Show Success Toast
            </Button>
            <Button onPress={() => showToast('warning')} style={tw`mb-2`}>
              Show Warning Toast
            </Button>
            <Button onPress={() => showToast('destructive')}>
              Show Error Toast
            </Button>
          </CardContent>
        </Card>

        {/* Form Components */}
        <Card style={tw`mb-4`}>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>Test form inputs and validation</CardDescription>
          </CardHeader>
          <CardContent>
            <Form>
              <FormField label="Input Field" required>
                <Input
                  placeholder="Enter text..."
                  value={inputValue}
                  onChangeText={setInputValue}
                />
              </FormField>
              
              <FormField label="Textarea Field">
                <Textarea
                  placeholder="Enter multi-line text..."
                  value={textareaValue}
                  onChangeText={setTextareaValue}
                  rows={3}
                />
              </FormField>

              <FormField label="Switch">
                <Switch
                  checked={switchValue}
                  onCheckedChange={setSwitchValue}
                />
              </FormField>

              <FormField label="Radio Group">
                <RadioGroup
                  options={radioOptions}
                  value={radioValue}
                  onValueChange={setRadioValue}
                />
              </FormField>

              <FormMessage variant="default">
                This is a form message
              </FormMessage>
            </Form>
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card style={tw`mb-4`}>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
            <CardDescription>Different avatar sizes and fallbacks</CardDescription>
          </CardHeader>
          <CardContent style={tw`flex-row space-x-4`}>
            <Avatar size="sm" fallback="JD" />
            <Avatar size="md" fallback="JD" />
            <Avatar size="lg" fallback="JD" />
            <Avatar size="xl" fallback="JD" />
          </CardContent>
        </Card>

        {/* Progress */}
        <Card style={tw`mb-4`}>
          <CardHeader>
            <CardTitle>Progress Bar</CardTitle>
            <CardDescription>Progress indicator with percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={progressValue} max={100} />
            <Text style={[tw`text-sm mt-2`, { color: theme.colors.mutedForeground }]}>
              {progressValue}% complete
            </Text>
          </CardContent>
        </Card>

        {/* Separator */}
        <Card style={tw`mb-4`}>
          <CardHeader>
            <CardTitle>Separators</CardTitle>
            <CardDescription>Visual dividers between content</CardDescription>
          </CardHeader>
          <CardContent>
            <Text style={[tw`text-sm`, { color: theme.colors.foreground }]}>
              Above separator
            </Text>
            <Separator orientation="horizontal" />
            <Text style={[tw`text-sm`, { color: theme.colors.foreground }]}>
              Below separator
            </Text>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Toast Container */}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </SafeAreaView>
  );
} 