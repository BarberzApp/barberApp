import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Dimensions,
  Image,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import tw from 'twrnc';
import { Button, Card, CardHeader, CardContent, Input } from '../components/index';
import { RootStackParamList } from '../types/types';
import { theme } from '../lib/theme';
import { 
  Scissors, 
  Calendar, 
  DollarSign, 
  Users, 
  Star, 
  TrendingUp, 
  CheckCircle,
  ArrowRight,
  Play,
  Award,
  Zap,
  Heart,
  MessageCircle,
  Share2,
  Eye,
  MapPin,
  Sparkles,
  Video,
  User,
  ChevronRight
} from 'lucide-react-native';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Styles
const styles = {
  darkBg: { backgroundColor: '#0F0F0F' },
  cardBg: { backgroundColor: '#1A1A1A' },
  transparentBorder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  primaryBtn: {
    backgroundColor: theme.colors.secondary,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)'
  }
};

// Components
const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <View style={tw`px-5 mb-6`}>
    <Text style={tw`text-2xl font-bold text-white mb-2`}>{title}</Text>
    {subtitle && <Text style={tw`text-white/60 text-base`}>{subtitle}</Text>}
  </View>
);

const FeatureItem = ({ icon: Icon, text, subtext }: any) => (
  <View style={[tw`flex-row items-center p-4 rounded-2xl`, styles.cardBg, styles.transparentBorder]}>
    <View style={[tw`w-12 h-12 rounded-xl items-center justify-center mr-4`, { backgroundColor: theme.colors.secondary + '15' }]}>
      <Icon size={24} color={theme.colors.secondary} />
    </View>
    <View style={tw`flex-1`}>
      <Text style={tw`text-white font-semibold text-base`}>{text}</Text>
      <Text style={tw`text-white/50 text-sm`}>{subtext}</Text>
    </View>
  </View>
);

const ActionButton = ({ onPress, icon: Icon, count }: any) => (
  <TouchableOpacity style={tw`items-center`}>
    <View style={[tw`w-12 h-12 rounded-full items-center justify-center mb-1`, 
      { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
      <Icon size={24} color="#fff" />
    </View>
    <Text style={tw`text-white text-xs font-medium`}>{count}</Text>
  </TouchableOpacity>
);

export default function HomePage() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [averageMonthlyAmount, setAverageMonthlyAmount] = useState("5000");
  const [cutCost, setCutCost] = useState("50");
  const [numberOfCuts, setNumberOfCuts] = useState(100);
  const [platformFeeBonus, setPlatformFeeBonus] = useState(135);
  const [extraAnnual, setExtraAnnual] = useState(1620);

  const updateCalculator = () => {
    const monthlyAmount = parseFloat(averageMonthlyAmount) || 5000;
    const servicePrice = parseFloat(cutCost) || 50;
    const cuts = Math.round(monthlyAmount / servicePrice);
    const bonus = cuts * 1.35;
    const annual = bonus * 12;
    setNumberOfCuts(cuts);
    setPlatformFeeBonus(bonus);
    setExtraAnnual(annual);
  };

  useEffect(() => {
    updateCalculator();
  }, [averageMonthlyAmount, cutCost]);

  const testimonials = [
    {
      name: "Chance Robenson",
      role: "Master Barber",
      location: "Princeton, NJ",
      revenue: "$50K/year",
      quote: "BOCM made running my business so much easier. My clients love the booking experience, and I've seen my revenue grow every month.",
      rating: 5,
      growth: "+45%"
    },
    {
      name: "Caleb Bock",
      role: "Senior Stylist",
      location: "Blacksburg, VA",
      revenue: "$65K/year",
      quote: "Since switching to BOCM, I spend less time on admin and more time with my clients. The reminders and scheduling are a game changer!",
      rating: 5,
      growth: "+62%"
    }
  ];

  const features = [
    {
      number: "01",
      title: "Social Media Integration",
      description: "Connect your Instagram, Twitter, and Facebook to showcase your best cuts.",
      icon: Star,
      color: theme.colors.secondary
    },
    {
      number: "02", 
      title: "Revenue Optimization",
      description: "Boost your earnings with smart pricing and analytics.",
      icon: DollarSign,
      color: theme.colors.secondary
    },
    {
      number: "03",
      title: "Reach System",
      description: "Get discovered by more clients and grow your business faster.",
      icon: Zap,
      color: theme.colors.secondary,
      beta: true
    },
    {
      number: "04",
      title: "Client Management",
      description: "Manage client profiles and preferences easily.",
      icon: Users,
      color: theme.colors.secondary
    }
  ];

  const showcaseCuts = [
    {
      id: "1",
      title: "Fade Masterpiece",
      barber: "Chance Robenson",
      views: "2.4K",
      likes: "156",
      comments: "23",
      category: "Fade",
      price: "$45",
      location: "Princeton, NJ"
    },
    {
      id: "2",
      title: "Classic Taper",
      barber: "Caleb Bock",
      views: "1.8K",
      likes: "120",
      comments: "15",
      category: "Taper",
      price: "$40",
      location: "Blacksburg, VA"
    }
  ];

  const whyChooseItems = [
    { icon: CheckCircle, text: "Zero Setup Fees", subtext: "Start earning immediately" },
    { icon: Zap, text: "Instant Payments", subtext: "Get paid right after service" },
    { icon: Users, text: "Social Growth", subtext: "Build your brand & following" }
  ];

  const CalcInput = ({ label, value, onChange }: any) => (
    <View>
      <Text style={tw`text-white font-medium mb-2 text-base`}>{label}</Text>
      <View style={tw`relative`}>
        <Text style={tw`absolute left-4 top-4 text-white/40 text-lg z-10`}>$</Text>
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text.replace(/[^\d]/g, ''))}
          style={[tw`w-full pl-10 pr-4 py-4 rounded-2xl text-white text-xl font-bold`, styles.input]}
          placeholder={value}
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="numeric"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[tw`flex-1`, { backgroundColor: theme.colors.primary }]}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={tw`flex-1`}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={true} contentContainerStyle={tw`pb-8`}>
          
          {/* Header */}
          <View style={[tw`px-5 py-4`, styles.darkBg]}>
            <View style={tw`flex-row items-center justify-between`}>
              <Image source={require('../../assets/images/icon.png')} style={{ width: 32, height: 32 }} resizeMode="contain" />
              <View style={tw`flex-row gap-2`}>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.8}
                  style={[tw`px-4 py-2 rounded-xl`, styles.secondaryBtn]}>
                  <Text style={tw`text-white font-medium text-sm`}>Log In</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.8}
                  style={[tw`px-4 py-2 rounded-xl`, { backgroundColor: theme.colors.secondary }]}>
                  <Text style={[tw`font-medium text-sm`, { color: theme.colors.primary }]}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Hero Section */}
          <View style={[tw`relative`, styles.darkBg]}>
            <View style={tw`absolute inset-0 overflow-hidden`}>
              <View style={[tw`absolute -top-20 -right-20 w-80 h-80 rounded-full`, { backgroundColor: theme.colors.secondary, opacity: 0.05 }]} />
              <View style={[tw`absolute -bottom-40 -left-40 w-96 h-96 rounded-full`, { backgroundColor: theme.colors.secondary, opacity: 0.03 }]} />
            </View>

            <View style={tw`px-5 pt-4 pb-12 relative`}>
              <View style={tw`items-center mb-6`}>
                <View style={[tw`px-4 py-1.5 rounded-full flex-row items-center`,
                  { backgroundColor: theme.colors.secondary + '20', borderWidth: 1, borderColor: theme.colors.secondary + '30' }]}>
                  <Sparkles size={14} color={theme.colors.secondary} style={tw`mr-1.5`} />
                  <Text style={[tw`text-xs font-semibold tracking-wide`, { color: theme.colors.secondary }]}>
                    SOCIAL BOOKING PLATFORM
                  </Text>
                </View>
              </View>

              <View style={tw`mb-6`}>
                <Text style={tw`text-4xl font-bold text-white text-center mb-2 leading-tight`}>The Future of</Text>
                <View style={[tw`self-center px-2 py-1 rounded-lg mb-2`, { backgroundColor: theme.colors.secondary }]}>
                  <Text style={[tw`text-4xl font-bold text-center`, { color: theme.colors.primary }]}>Cosmetology</Text>
                </View>
                <Text style={tw`text-4xl font-bold text-white text-center`}>Booking</Text>
              </View>

              <Text style={tw`text-base text-white/70 text-center px-4 mb-6 leading-relaxed`}>
                Connect, showcase, and grow. BOCM is the first social booking platform that lets cosmetologists share their work, build their brand, and book clients seamlessly.
              </Text>

              <View style={tw`gap-3 mb-8`}>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.8}
                  style={[tw`py-4 px-6 rounded-2xl flex-row items-center justify-center`, styles.primaryBtn]}>
                  <Text style={[tw`text-lg font-bold mr-2`, { color: theme.colors.primary }]}>Start Your Journey</Text>
                  <ArrowRight size={20} color={theme.colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={[tw`py-4 px-6 rounded-2xl flex-row items-center justify-center`, styles.secondaryBtn]}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Cuts' } as any)} activeOpacity={0.8}>
                  <Play size={20} color="#fff" style={tw`mr-2`} />
                  <Text style={tw`text-white font-semibold text-base`}>Watch Real Results</Text>
                </TouchableOpacity>
              </View>

              <View style={tw`gap-3`}>
                {whyChooseItems.map((item, index) => <FeatureItem key={index} {...item} />)}
              </View>
            </View>
          </View>

          {/* Revenue Dashboard */}
          <View style={tw`px-5 -mt-6`}>
            <View style={[tw`rounded-3xl overflow-hidden`, styles.cardBg, styles.cardShadow,
              { borderWidth: 1, borderColor: theme.colors.secondary + '10' }]}>
              <View style={tw`p-5`}>
                <View style={tw`flex-row items-center justify-between mb-5`}>
                  <Text style={tw`text-xl font-bold text-white`}>Revenue Dashboard</Text>
                  <View style={[tw`flex-row items-center px-3 py-1.5 rounded-full`, { backgroundColor: theme.colors.secondary + '20' }]}>
                    <TrendingUp size={16} color={theme.colors.secondary} style={tw`mr-1`} />
                    <Text style={[tw`text-sm font-semibold`, { color: theme.colors.secondary }]}>+40%</Text>
                  </View>
                </View>

                <View style={tw`flex-row gap-3 mb-4`}>
                  {[
                    { label: 'Monthly Revenue', value: '$12,450' },
                    { label: 'Bookings', value: '127' }
                  ].map((item, i) => (
                    <View key={i} style={[tw`flex-1 p-4 rounded-2xl`, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                      <Text style={tw`text-white/50 text-sm mb-1`}>{item.label}</Text>
                      <Text style={tw`text-2xl font-bold text-white`}>{item.value}</Text>
                    </View>
                  ))}
                </View>
                
                <View style={[tw`p-4 rounded-2xl`, { backgroundColor: theme.colors.secondary + '20', borderWidth: 1, borderColor: theme.colors.secondary + '30' }]}>
                  <Text style={[tw`text-sm font-medium mb-1`, { color: theme.colors.secondary }]}>This Month's Growth</Text>
                  <Text style={[tw`text-2xl font-bold`, { color: theme.colors.secondary }]}>+$3,200</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Showcase Section */}
          <View style={tw`mt-12`}>
            <SectionHeader title="Showcase Your Work" subtitle="Share your best cuts and attract new clients" />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tw`px-5`}
              snapToInterval={screenWidth * 0.65 + 12} decelerationRate="fast">
              {showcaseCuts.map((cut) => (
                <TouchableOpacity key={cut.id} onPress={() => navigation.navigate('MainTabs', { screen: 'Cuts' } as any)}
                  activeOpacity={0.9} style={[tw`mr-3`, { width: screenWidth * 0.65 }]}>
                  <View style={[tw`rounded-3xl overflow-hidden relative`, styles.cardBg, styles.cardShadow, { aspectRatio: 9/16 }]}>
                    <View style={[tw`absolute inset-0 z-10`, { backgroundColor: 'transparent', shadowColor: '#000',
                      shadowOffset: { width: 0, height: -100 }, shadowOpacity: 0.8, shadowRadius: 100 }]} />
                    
                    <View style={tw`flex-1 relative`}>
                      <View style={[tw`absolute inset-0`, { backgroundColor: theme.colors.secondary + '10' }]} />
                      
                      <View style={tw`absolute inset-0 items-center justify-center`}>
                        <View style={[tw`w-16 h-16 rounded-full items-center justify-center`,
                          { backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }]}>
                          <Play size={32} color="#fff" fill="#fff" style={tw`ml-1`} />
                        </View>
                      </View>

                      <View style={tw`absolute right-4 bottom-24 gap-4 z-20`}>
                        {[
                          { icon: Heart, count: cut.likes },
                          { icon: MessageCircle, count: cut.comments },
                          { icon: Share2, count: 'Share' }
                        ].map((action, idx) => <ActionButton key={idx} {...action} />)}
                      </View>

                      <View style={[tw`absolute bottom-0 left-0 right-0 p-4 z-20`, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                        <View style={tw`flex-row items-center mb-3`}>
                          <View style={[tw`h-10 w-10 rounded-full mr-3 items-center justify-center`, { backgroundColor: theme.colors.secondary }]}>
                            <Text style={tw`text-black font-bold text-base`}>{cut.barber.split(' ').map(n => n[0]).join('')}</Text>
                          </View>
                          <View style={tw`flex-1`}>
                            <Text style={tw`font-semibold text-white text-base`}>@{cut.barber.toLowerCase().replace(/\s+/g, '')}</Text>
                            <Text style={tw`text-white/60 text-sm`}>{cut.location}</Text>
                          </View>
                        </View>
                        
                        <Text style={tw`text-white text-lg font-semibold mb-3`}>{cut.title}</Text>
                        
                        <View style={tw`flex-row items-center justify-between`}>
                          <View style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                            <Text style={tw`text-white text-sm font-medium`}>{cut.category}</Text>
                          </View>
                          <View style={[tw`px-3 py-1.5 rounded-full`, { backgroundColor: theme.colors.secondary }]}>
                            <Text style={[tw`text-sm font-bold`, { color: theme.colors.primary }]}>{cut.price}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={tw`mt-6 px-5`}>
              <TouchableOpacity onPress={() => navigation.navigate('MainTabs', { screen: 'Cuts' } as any)} activeOpacity={0.8}
                style={[tw`py-4 px-6 rounded-2xl flex-row items-center justify-center`, styles.primaryBtn]}>
                <Video size={20} color={theme.colors.primary} style={tw`mr-2`} />
                <Text style={[tw`text-base font-bold`, { color: theme.colors.primary }]}>Explore All Cuts</Text>
                <ChevronRight size={20} color={theme.colors.primary} style={tw`ml-1`} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Revenue Calculator */}
          <View style={tw`px-5 mt-12`}>
            <Text style={tw`text-2xl font-bold text-white text-center mb-2`}>The "Holy Sh*t" Moment</Text>
            <Text style={tw`text-white/60 text-base text-center mb-6`}>See how much more you could be earning</Text>

            <View style={[tw`rounded-3xl overflow-hidden`, styles.cardBg, styles.cardShadow,
              { borderWidth: 1, borderColor: theme.colors.secondary + '10' }]}>
              <View style={tw`p-5`}>
                <View style={tw`gap-4 mb-6`}>
                  <CalcInput label="Average Monthly Amount" value={averageMonthlyAmount} onChange={setAverageMonthlyAmount} />
                  <CalcInput label="Cut Cost" value={cutCost} onChange={setCutCost} />
                </View>

                <View style={tw`items-center mb-6`}>
                  <Text style={tw`text-lg text-white/60 mb-3`}>
                    You do <Text style={[tw`font-bold text-xl`, { color: theme.colors.secondary }]}>{numberOfCuts}</Text> cuts per month
                  </Text>
                  
                  <View style={[tw`p-5 rounded-2xl w-full mb-4`,
                    { backgroundColor: theme.colors.secondary + '15', borderWidth: 1, borderColor: theme.colors.secondary + '25' }]}>
                    <Text style={tw`text-white/60 text-sm mb-1 text-center`}>Platform Fee Bonus</Text>
                    <Text style={[tw`text-3xl font-bold text-center mb-2`, { color: theme.colors.secondary }]}>
                      ${platformFeeBonus.toFixed(0)}/month
                    </Text>
                    <View style={[tw`h-px my-3`, { backgroundColor: theme.colors.secondary + '20' }]} />
                    <Text style={tw`text-white text-center`}>
                      That's <Text style={[tw`font-bold text-xl`, { color: theme.colors.secondary }]}>${extraAnnual.toFixed(0)}</Text> extra per year!
                    </Text>
                  </View>

                  <View style={[tw`p-4 rounded-2xl w-full`, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                    <Text style={tw`text-white/50 text-sm mb-1`}>Breakdown:</Text>
                    <Text style={tw`text-white text-base font-semibold`}>
                      {numberOfCuts} cuts × $1.35 = <Text style={{ color: theme.colors.secondary }}>${platformFeeBonus.toFixed(0)}</Text> per month
                    </Text>
                  </View>
                </View>

                <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.8}
                  style={[tw`py-4 px-6 rounded-2xl`, styles.primaryBtn]}>
                  <Text style={[tw`text-lg font-bold text-center`, { color: theme.colors.primary }]}>Start Earning More Today</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Features Section */}
          <View style={tw`px-5 mt-12`}>
            <SectionHeader title="Everything You Need to Scale" subtitle="Tools to transform your cosmetology business" />

            <View style={tw`gap-4`}>
              {features.map((feature, index) => (
                <TouchableOpacity key={index} activeOpacity={0.8}
                  style={[tw`rounded-3xl overflow-hidden`, styles.cardBg, styles.cardShadow, styles.transparentBorder]}>
                  <View style={tw`p-5`}>
                    <View style={tw`flex-row items-start justify-between mb-3`}>
                      <View style={[tw`w-14 h-14 rounded-2xl items-center justify-center`, { backgroundColor: theme.colors.secondary }]}>
                        <feature.icon size={28} color="#0F0F0F" />
                      </View>
                      <Text style={tw`text-4xl text-white/5 font-bold`}>{feature.number}</Text>
                    </View>
                    
                    <View style={tw`flex-row items-center gap-2 mb-2`}>
                      <Text style={tw`text-xl font-bold text-white flex-1`}>{feature.title}</Text>
                      {feature.beta && (
                        <View style={[tw`px-3 py-1 rounded-full`, { backgroundColor: theme.colors.secondary }]}>
                          <Text style={tw`text-black text-xs font-bold`}>BETA</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={tw`text-white/60 text-base leading-relaxed`}>{feature.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Testimonials */}
          <View style={[tw`mt-12 py-8`, { backgroundColor: 'rgba(255,255,255,0.02)' }]}>
            <SectionHeader title="Success Stories" subtitle="Real results from real cosmetologists" />

            <View style={tw`px-5 gap-4`}>
              {testimonials.map((testimonial, index) => (
                <View key={index} style={[tw`rounded-3xl overflow-hidden`, styles.cardBg, styles.cardShadow,
                  { borderWidth: 1, borderColor: theme.colors.secondary + '10' }]}>
                  <View style={tw`p-5`}>
                    <View style={tw`flex-row items-start gap-4 mb-4`}>
                      <View style={[tw`h-14 w-14 rounded-full items-center justify-center`, { backgroundColor: theme.colors.secondary }]}>
                        <Text style={tw`text-black font-bold text-lg`}>
                          {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </Text>
                      </View>
                      
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-lg font-bold text-white mb-1`}>{testimonial.name}</Text>
                        <Text style={tw`text-white/50 text-sm mb-2`}>{testimonial.role} • {testimonial.location}</Text>
                        <View style={tw`flex-row items-center gap-3`}>
                          <View style={tw`flex-row items-center`}>
                            <Text style={[tw`font-bold text-base mr-1`, { color: theme.colors.secondary }]}>{testimonial.revenue}</Text>
                            <Text style={tw`text-white/50 text-sm`}>revenue</Text>
                          </View>
                          <View style={[tw`px-2 py-0.5 rounded-full`, { backgroundColor: theme.colors.secondary + '20' }]}>
                            <Text style={[tw`text-xs font-bold`, { color: theme.colors.secondary }]}>{testimonial.growth}</Text>
                          </View>
                        </View>
                        <View style={tw`flex-row mt-2`}>
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} size={16} color={theme.colors.secondary} fill={theme.colors.secondary} />
                          ))}
                        </View>
                      </View>
                    </View>
                    
                    <Text style={tw`text-white/80 text-base leading-relaxed italic`}>"{testimonial.quote}"</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Final CTA */}
          <View style={tw`px-5 mt-12 mb-8`}>
            <View style={[tw`rounded-3xl p-6`, { backgroundColor: theme.colors.secondary + '15', borderWidth: 1, borderColor: theme.colors.secondary + '25' }]}>
              <Text style={tw`text-2xl font-bold text-white text-center mb-3`}>Ready to Transform Your Business?</Text>
              <Text style={tw`text-lg text-white/70 text-center mb-6`}>Join thousands who are already growing with BOCM</Text>
              
              <View style={tw`gap-3`}>
                <TouchableOpacity onPress={() => navigation.navigate('SignUp')} activeOpacity={0.8}
                  style={[tw`py-4 px-6 rounded-2xl flex-row items-center justify-center`, styles.primaryBtn]}>
                  <Text style={[tw`text-lg font-bold mr-2`, { color: theme.colors.primary }]}>Get Started Free</Text>
                  <ArrowRight size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity style={[tw`py-4 px-6 rounded-2xl`, styles.secondaryBtn]}
                  onPress={() => navigation.navigate('MainTabs', { screen: 'Search' } as any)} activeOpacity={0.8}>
                  <Text style={tw`text-white font-semibold text-base text-center`}>Browse Stylists</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={[tw`py-8 items-center`, { backgroundColor: '#0A0A0A' }]}>
            <Image source={require('../../assets/images/icon.png')} style={{ width: 40, height: 40, marginBottom: 8 }} resizeMode="contain" />
            <Text style={tw`text-white/40 text-sm mb-1`}>© 2025 BOCM. All rights reserved.</Text>
            <Text style={[tw`text-sm font-medium`, { color: theme.colors.secondary + '80' }]}>The future of booking.</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}