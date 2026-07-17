import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/i18n/strings.g.dart';

/// Placeholder for the password-reset flow.
///
/// **E18-F03-S01 replaces this** with the real three-step machine
/// (`ForgotCubit`) behind the brand design. It exists now only so that
/// [AppRoutes.forgot] can be wired ahead of that card: pre-registering the
/// route is what lets the auth work land without touching `routes.dart`, and
/// therefore without colliding with the parallel Home/Player cards in it.
class ForgotScreen extends StatelessWidget {
  const ForgotScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: AppEmptyState(
          icon: IconName.lock,
          title: context.t.auth.forgot.title,
          message: context.t.common.comingSoon,
        ),
      ),
    );
  }
}
