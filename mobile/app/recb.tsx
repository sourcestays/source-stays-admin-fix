import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { Link, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const PORTAL = "https://cashback.zylusgroup.com/";
const WHATSAPP = "https://wa.me/2347085404814?text=" + encodeURIComponent("Hello Source Stays, I would like to enquire about the Real Estate Cashback programme.");

async function openExternal(url: string) {
  try { await Linking.openURL(url); } catch { /* Native linking reports unavailable destinations to the user. */ }
}

export default function RecbScreen() {
  async function shareConsultantDetails() {
    await Share.share({ message: "Source Stays — registered consultant name. Consultant ID (CID): 612675. Please verify that these details are accepted and recorded on the official Zylus RECB portal: " + PORTAL });
  }

  return (
    <SafeAreaView style={s.safe}>
      <Stack.Screen options={{ title: "Real Estate Cashback", headerShown: false }} />
      <ScrollView contentContainerStyle={s.content}>
        <Link href="/division/realestate" style={s.back}>← Back to Real Estate</Link>
        <Text style={s.eyebrow}>SOURCE STAYS × ZYLUS GROUP INTERNATIONAL</Text>
        <View style={s.hero}>
          <Text style={s.powered}>POWERED BY ZYLUS GROUP INTERNATIONAL</Text>
          <Text style={s.title}>Explore Real Estate Investment Cashback</Text>
          <Text style={s.copy}>Learn about the Real Estate Investment Cash Back (RECB) programme and review the official Zylus registration process with Source Stays as your consultant.</Text>
          <Pressable onPress={() => openExternal(PORTAL)} style={s.primary}><Text style={s.primaryText}>Visit official RECB portal ↗</Text></Pressable>
        </View>

        <View style={s.card}>
          <Text style={s.section}>Register with Source Stays</Text>
          <Text style={s.copyDark}>When completing your RECB registration, look for the Realtor / Consultant CID field. Use the details below and verify they appear correctly on the official portal before submitting your application.</Text>
          <Text style={s.label}>CONSULTANT NAME</Text>
          <Text style={s.value}>Source Stays</Text>
          <Text style={s.label}>CONSULTANT ID (CID)</Text>
          <Text style={s.cid}>612675</Text>
          <Pressable onPress={shareConsultantDetails} style={s.secondary}><Text style={s.secondaryText}>Share consultant details</Text></Pressable>
          <Text style={s.warning}>Displaying the CID here does not automatically lock or submit it to Zylus. The official registration system must accept and record these details for referral attribution.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.section}>Explore the RECB programme</Text>
          <Text style={s.copyDark}>Review the programme information and promotional materials carefully. Confirm current official terms, eligibility, investment amounts and risks with Zylus before making an investment. Advertised dividends and incentives are not guaranteed.</Text>
          <View style={s.bullet}><Text style={s.bulletTitle}>Dividend breakdown</Text><Text style={s.copyDark}>Confirm the official terms with Zylus.</Text></View>
          <View style={s.bullet}><Text style={s.bulletTitle}>Investment tiers</Text><Text style={s.copyDark}>Verify current amounts and eligibility.</Text></View>
          <View style={s.bullet}><Text style={s.bulletTitle}>Client incentives</Text><Text style={s.copyDark}>Availability depends on official programme terms.</Text></View>
        </View>

        <View style={s.card}>
          <Text style={s.section}>Invest with confidence through verification</Text>
          <Text style={s.copyDark}>Before making any payment or investment, verify the programme, understand the official terms, and confirm your consultant details.</Text>
          {[
            ["1. Use the official registration portal","Access the programme through the official Zylus RECB portal. Review the information and terms presented there before registering."],
            ["2. Confirm your consultant details","Check that the official registration system accepts and records Source Stays and CID 612675. Their display here alone does not guarantee referral attribution."],
            ["3. Understand the terms before paying","Confirm the investment amount, eligibility, applicable fees, withdrawal or resale conditions, and any advertised dividends or incentives directly with Zylus. Never rely on guaranteed-return promises or transfer investment funds to a personal account. Follow only verified official payment instructions."]
          ].map(([heading, body]) => <View key={heading} style={s.bullet}><Text style={s.bulletTitle}>{heading}</Text><Text style={s.copyDark}>{body}</Text></View>)}
        </View>

        <View style={s.card}>
          <Text style={s.section}>How to begin</Text>
          <Text style={s.copyDark}>Use the official Zylus portal for current programme information, eligibility, terms and registration.</Text>
          <Text style={s.bulletTitle}>01 · Review the programme</Text><Text style={s.copyDark}>Read the current information, eligibility requirements, fees, investment terms and cashback conditions published by Zylus.</Text>
          <Text style={s.bulletTitle}>02 · Complete registration</Text><Text style={s.copyDark}>Enter your personal details on the official portal. Where requested, use consultant name Source Stays and CID 612675.</Text>
          <Text style={s.bulletTitle}>03 · Confirm before paying</Text><Text style={s.copyDark}>Confirm the application shows the correct consultant attribution and that you understand the official terms before making payment.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.section}>Frequently asked questions</Text>
          {[
            ["Does Source Stays receive commission when I register?","Registration alone does not confirm a commission. Any commission depends on Zylus's current referral rules, successful attribution and eligibility conditions. Confirm these with Zylus."],
            ["Is cashback or a return guaranteed?","No guarantee is made. Check the current official programme terms for cashback eligibility, timing, investment risks and any returns before committing funds."],
            ["Where should I submit my application and payment?","Use the official Zylus RECB portal and its payment instructions. Source Stays does not collect investment funds or sensitive registration documents through this page."],
            ["What if I cannot enter the consultant CID?","Do not assume the referral has been recorded. Contact Zylus and ask them to confirm the application is attributed to Source Stays, CID 612675, before paying."]
          ].map(([question, answer]) => <View key={question} style={s.faq}><Text style={s.bulletTitle}>{question}</Text><Text style={s.copyDark}>{answer}</Text></View>)}
          <Text style={s.disclaimer}>This page provides general programme information and referral guidance, not financial, legal or investment advice. Review the official documentation and independently assess the risks before investing.</Text>
        </View>

        <View style={s.bottom}>
          <Text style={s.section}>Ready to review the RECB programme?</Text>
          <Text style={s.copyDark}>Continue to the official portal to review current requirements and registration.</Text>
          <Pressable onPress={() => openExternal(PORTAL)} style={s.primary}><Text style={s.primaryText}>Open RECB portal ↗</Text></Pressable>
          <Pressable onPress={() => openExternal(WHATSAPP)} style={s.secondary}><Text style={s.secondaryText}>Ask Source Stays on WhatsApp</Text></Pressable>
        </View>
        <Text style={s.footer}>SOURCE STAYS · SHORTLETS · HOTELS · REAL ESTATE</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#F8F7F2"},content:{padding:20,paddingBottom:42},back:{color:"#123D2B",fontWeight:"700",marginBottom:22},
  eyebrow:{color:"#A77D31",fontSize:9,fontWeight:"900",letterSpacing:1.2,marginBottom:10},
  hero:{backgroundColor:"#123D2B",borderRadius:20,padding:22,marginBottom:15},powered:{color:"#D6B66E",fontSize:9,fontWeight:"900",letterSpacing:1.1},title:{color:"#fff",fontSize:28,lineHeight:34,fontWeight:"900",marginTop:13},copy:{color:"#E0E8E1",fontSize:12,lineHeight:19,marginTop:12},
  primary:{backgroundColor:"#D0AD62",padding:14,borderRadius:11,alignItems:"center",marginTop:18},primaryText:{color:"#173E2D",fontSize:12,fontWeight:"900"},
  card:{backgroundColor:"#fff",borderRadius:16,borderWidth:1,borderColor:"#E9E8E0",padding:17,marginBottom:14},section:{color:"#173E2D",fontSize:18,fontWeight:"900",marginBottom:9},copyDark:{color:"#667168",fontSize:12,lineHeight:19,marginTop:5},
  label:{color:"#A77D31",fontSize:9,fontWeight:"900",letterSpacing:1,marginTop:16},value:{color:"#173E2D",fontSize:16,fontWeight:"800",marginTop:5},cid:{color:"#173E2D",fontSize:25,fontWeight:"900",letterSpacing:1,marginTop:4},
  secondary:{borderWidth:1,borderColor:"#C6A45D",padding:12,borderRadius:10,alignItems:"center",marginTop:12},secondaryText:{color:"#173E2D",fontSize:11,fontWeight:"800"},
  warning:{backgroundColor:"#FFF8E8",color:"#765D2B",fontSize:10,lineHeight:16,padding:11,borderRadius:9,marginTop:13},bullet:{borderTopWidth:1,borderTopColor:"#EEECE5",paddingTop:12,marginTop:12},bulletTitle:{color:"#173E2D",fontSize:12,fontWeight:"900",marginTop:8},faq:{borderTopWidth:1,borderTopColor:"#EEECE5",paddingTop:12,marginTop:12},disclaimer:{color:"#7B7569",fontSize:10,lineHeight:16,marginTop:16},bottom:{backgroundColor:"#F0EEE5",borderRadius:16,padding:18,marginTop:4},footer:{textAlign:"center",color:"#9A9C92",fontSize:9,letterSpacing:1.1,marginTop:20}
});
