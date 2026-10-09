#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
أداة نشر متجر وموقع بوت الشطرنج على استضافة GitHub Pages المجانية
لصاحب المشروع: محمود رحيل (@owner_1_1)
"""

import os
import sys
import subprocess
import shutil

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def run_cmd(cmd, cwd=None):
    try:
        res = subprocess.run(cmd, shell=True, check=True, text=True, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"[-] خطأ أثناء تنفيذ الأمر: {cmd}")
        print(f"التفاصيل: {e.stderr}")
        return None

def main():
    print("=" * 65)
    print("   [STEALTH CHESS] - ناشر الموقع الإلكتروني على GitHub Pages")
    print("   المالك والمطور: محمود رحيل (@owner_1_1)")
    print("=" * 65)

    base_dir = os.path.dirname(os.path.abspath(__file__))
    deploy_dir = os.path.join(base_dir, "web_shop_deploy")

    if not os.path.exists(deploy_dir):
        print("[-] مجلد web_shop_deploy غير موجود!")
        input("\nاضغط Enter للخروج...")
        return

    # Check git
    git_ver = run_cmd("git --version")
    if not git_ver:
        print("[-] برنامج Git غير مثبت على جهازك. يرجى تثبيته أولاً.")
        input("\nاضغط Enter للخروج...")
        return

    print("\n[+] خطوات تجهيز مستودع جديد على GitHub:")
    print("1. افتح موقع https://github.com وسجل دخولك.")
    print("2. اضغط على الزر الأخضر (New Repository).")
    print("3. اكتب اسم المستودع، مثلاً: stealth-chess-store")
    print("4. اختر Public (عام) أو Private.")
    print("5. لا تضع علامة صح على README أو .gitignore.")
    print("6. اضغط (Create repository).")
    print("7. انسخ رابط المستودع الذي ينتهي بـ .git والصقه هنا.")
    print("-" * 65)

    repo_url = input("\nالصق رابط مستودع GitHub الجديد هنا:\n> ").strip()
    if not repo_url:
        print("[-] لم يتم إدخال رابط. تم إلغاء العملية.")
        input("\nاضغط Enter للخروج...")
        return

    # Reset any git in deploy_dir
    git_folder = os.path.join(deploy_dir, ".git")
    if os.path.exists(git_folder):
        try:
            shutil.rmtree(git_folder)
        except Exception:
            pass

    print("\n[1/4] تهيئة مستودع Git في مجلد الموقع...")
    run_cmd("git init", cwd=deploy_dir)
    run_cmd("git branch -M main", cwd=deploy_dir)

    print("\n[2/4] إضافة الملفات وحفظ التغييرات...")
    run_cmd("git add .", cwd=deploy_dir)
    run_cmd('git commit -m "Deploy Stealth Chess Storefront"', cwd=deploy_dir)

    print(f"\n[3/4] ربط المستودع: {repo_url}...")
    run_cmd(f"git remote add origin {repo_url}", cwd=deploy_dir)

    print("\n[4/4] رفع الموقع إلى GitHub...")
    res = run_cmd("git push -u origin main --force", cwd=deploy_dir)

    if res is not None:
        print("\n" + "=" * 65)
        print("  🎉 تم رفع موقع المتجر إلى GitHub بنجاح تام!")
        print("=" * 65)
        print("\nلتفعيل استضافة الموقع مجاناً فوراً على GitHub Pages:")
        print("1. افتح صفحة المستودع على GitHub.")
        print("2. اذهب إلى علامة التبويب: Settings (الإعدادات).")
        print("3. من القائمة الجانبية اليسرى اضغط على: Pages.")
        print("4. تحت قسم 'Build and deployment' -> اختر Source: 'Deploy from a branch'.")
        print("5. في قائمة Branch -> اختر 'main' ثم اضغط Save (حفظ).")
        print("\nخلال دقيقة واحدة سيكون موقعك متاحاً على الإنترنت مجاناً مدى الحياة!")
        print("🔒 ملاحظة أمان: ملف توليد المفاتيح (key_generator.html) محفوظ على جهازك فقط ولم يُرفع إلى GitHub أبداً.")
        print("=" * 65)
    else:
        print("[-] فشل الرفع. يرجى التأكد من صحة الرابط وصلاحيات الحساب.")

    input("\nاضغط Enter لإنهاء البرنامج...")

if __name__ == "__main__":
    main()
