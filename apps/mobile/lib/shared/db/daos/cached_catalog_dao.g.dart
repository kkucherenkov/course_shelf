// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'cached_catalog_dao.dart';

// ignore_for_file: type=lint
mixin _$CachedCatalogDaoMixin on DatabaseAccessor<AppDatabase> {
  $CachedCoursesTable get cachedCourses => attachedDatabase.cachedCourses;
  $CachedSectionsTable get cachedSections => attachedDatabase.cachedSections;
  $CachedLessonsTable get cachedLessons => attachedDatabase.cachedLessons;
  CachedCatalogDaoManager get managers => CachedCatalogDaoManager(this);
}

class CachedCatalogDaoManager {
  final _$CachedCatalogDaoMixin _db;
  CachedCatalogDaoManager(this._db);
  $$CachedCoursesTableTableManager get cachedCourses =>
      $$CachedCoursesTableTableManager(_db.attachedDatabase, _db.cachedCourses);
  $$CachedSectionsTableTableManager get cachedSections =>
      $$CachedSectionsTableTableManager(
        _db.attachedDatabase,
        _db.cachedSections,
      );
  $$CachedLessonsTableTableManager get cachedLessons =>
      $$CachedLessonsTableTableManager(_db.attachedDatabase, _db.cachedLessons);
}
