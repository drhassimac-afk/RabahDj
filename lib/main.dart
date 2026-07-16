import 'package:flutter/material.dart';

void main() {
  runApp(const SaasUltraApp());
}

class SaasUltraApp extends StatelessWidget {
  const SaasUltraApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SaaS ULTRA',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xff4f46e5), // Indigo
        scaffoldBackgroundColor: const Color(0xff0f172a), // Slate 900
        cardColor: const Color(0xff1e293b), // Slate 800
        fontFamily: 'Roboto',
      ),
      home: const DashboardScreen(),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '🚀 SaaS ULTRA',
          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        backgroundColor: Theme.of(context).cardColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none, color: Colors.white),
            onPressed: () {},
          ),
          const CircleAvatar(
            backgroundColor: Color(0xff4f46e5),
            child: Text('Drh', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Row(
        children: [
          // Navigation Rail Sidebar for Tablet/Large view representation
          NavigationRail(
            backgroundColor: Theme.of(context).cardColor,
            selectedIndex: _selectedIndex,
            onDestinationSelected: (int index) {
              setState(() {
                _selectedIndex = index;
              });
            },
            labelType: NavigationRailLabelType.all,
            selectedIconTheme: const IconThemeData(color: Color(0xff818cf8)),
            unselectedIconTheme: const IconThemeData(color: Colors.slate),
            destinations: const [
              NavigationRailDestination(
                icon: Icon(Icons.dashboard_customize_outlined),
                selectedIcon: Icon(Icons.dashboard_customize),
                label: Text('الرئيسية'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.cloud_queue_outlined),
                selectedIcon: Icon(Icons.cloud_queue),
                label: Text('الطقس'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.bolt_outlined),
                selectedIcon: Icon(Icons.bolt),
                label: Text('الأتمتة'),
              ),
            ],
          ),
          const VerticalDivider(thickness: 1, width: 1, color: Colors.slate),
          
          // Main Dashboard Content
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'مرحباً بك مجدداً، Drh 👋',
                      style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'مساعد الطقس والإنتاجية الذكي جاهز لإدارة أعمالك اليوم.',
                      style: TextStyle(fontSize: 14, color: Colors.slate),
                    ),
                    const SizedBox(height: 24),
                    
                    // Stats Cards Grid
                    GridView.count(
                      crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : 1,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 2.5,
                      children: [
                        _buildStatCard(
                          title: 'حالة الطقس الحالية',
                          value: '28°C - مشمس',
                          subtitle: 'مظهر إنتاجي ممتاز',
                          icon: Icons.wb_sunny,
                          iconColor: Colors.amber,
                        ),
                        _buildStatCard(
                          title: 'الأتمتة النشطة',
                          value: '12 عملية حية',
                          subtitle: 'تعمل بكفاءة الآن',
                          icon: Icons.autorenew,
                          iconColor: Colors.green,
                        ),
                        _buildStatCard(
                          title: 'استهلاك الـ API',
                          value: '94.2%',
                          subtitle: 'معدل استجابة سريع',
                          icon: Icons.speed,
                          iconColor: Colors.indigo,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    
                    // Weather Assistant Section
                    _buildSectionTitle('🌤️ مساعد الطقس والإنتاجية الذكي'),
                    const SizedBox(height: 12),
                    _buildAssistantActionCard(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
  }) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: iconColor.withOpacity(0.1),
              radius: 24,
              child: Icon(icon, color: iconColor, size: 28),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(title, style: const TextStyle(fontSize: 12, color: Colors.slate)),
                  const SizedBox(height: 4),
                  Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 2),
                  Text(subtitle, style: const TextStyle(fontSize: 10, color: Colors.grey)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
    );
  }

  Widget _buildAssistantActionCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20.0),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: [const Color(0xff4f46e5).withOpacity(0.3), const Color(0xff1e293b)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'أتمتة حية بناءً على الأجواء',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 8),
            const Text(
              'تم تفعيل ميزة جدولة المهام التلقائية وتحسين استهلاك الطاقة نظراً لاعتدال حالة الطقس الخارجية اليوم.',
              style: TextStyle(fontSize: 13, color: Colors.slate),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.bolt, size: 18, color: Colors.white),
              label: const Text('إدارة إعدادات الأتمتة الحية', style: TextStyle(color: Colors.white)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xff4f46e5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            )
          ],
        ),
      ),
    );
  }
}

