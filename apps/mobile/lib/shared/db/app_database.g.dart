// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $CachedCoursesTable extends CachedCourses
    with TableInfo<$CachedCoursesTable, CachedCourse> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedCoursesTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _libraryIdMeta = const VerificationMeta(
    'libraryId',
  );
  @override
  late final GeneratedColumn<String> libraryId = GeneratedColumn<String>(
    'library_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _slugMeta = const VerificationMeta('slug');
  @override
  late final GeneratedColumn<String> slug = GeneratedColumn<String>(
    'slug',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _titleMeta = const VerificationMeta('title');
  @override
  late final GeneratedColumn<String> title = GeneratedColumn<String>(
    'title',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    libraryId,
    slug,
    title,
    updatedAt,
    cachedAt,
    payload,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_courses';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedCourse> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('library_id')) {
      context.handle(
        _libraryIdMeta,
        libraryId.isAcceptableOrUnknown(data['library_id']!, _libraryIdMeta),
      );
    } else if (isInserting) {
      context.missing(_libraryIdMeta);
    }
    if (data.containsKey('slug')) {
      context.handle(
        _slugMeta,
        slug.isAcceptableOrUnknown(data['slug']!, _slugMeta),
      );
    } else if (isInserting) {
      context.missing(_slugMeta);
    }
    if (data.containsKey('title')) {
      context.handle(
        _titleMeta,
        title.isAcceptableOrUnknown(data['title']!, _titleMeta),
      );
    } else if (isInserting) {
      context.missing(_titleMeta);
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedCourse map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedCourse(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      libraryId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}library_id'],
      )!,
      slug: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}slug'],
      )!,
      title: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}title'],
      )!,
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
    );
  }

  @override
  $CachedCoursesTable createAlias(String alias) {
    return $CachedCoursesTable(attachedDatabase, alias);
  }
}

class CachedCourse extends DataClass implements Insertable<CachedCourse> {
  /// Server-generated cuid.
  final String id;
  final String libraryId;
  final String slug;
  final String title;

  /// `CourseDto.updatedAt` — server's value, used for staleness comparison.
  final DateTime updatedAt;

  /// When this row was written locally. E18/E19 own any TTL policy.
  final DateTime cachedAt;

  /// The full CourseDto as JSON.
  final String payload;
  const CachedCourse({
    required this.id,
    required this.libraryId,
    required this.slug,
    required this.title,
    required this.updatedAt,
    required this.cachedAt,
    required this.payload,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['library_id'] = Variable<String>(libraryId);
    map['slug'] = Variable<String>(slug);
    map['title'] = Variable<String>(title);
    map['updated_at'] = Variable<DateTime>(updatedAt);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    map['payload'] = Variable<String>(payload);
    return map;
  }

  CachedCoursesCompanion toCompanion(bool nullToAbsent) {
    return CachedCoursesCompanion(
      id: Value(id),
      libraryId: Value(libraryId),
      slug: Value(slug),
      title: Value(title),
      updatedAt: Value(updatedAt),
      cachedAt: Value(cachedAt),
      payload: Value(payload),
    );
  }

  factory CachedCourse.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedCourse(
      id: serializer.fromJson<String>(json['id']),
      libraryId: serializer.fromJson<String>(json['libraryId']),
      slug: serializer.fromJson<String>(json['slug']),
      title: serializer.fromJson<String>(json['title']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
      payload: serializer.fromJson<String>(json['payload']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'libraryId': serializer.toJson<String>(libraryId),
      'slug': serializer.toJson<String>(slug),
      'title': serializer.toJson<String>(title),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
      'payload': serializer.toJson<String>(payload),
    };
  }

  CachedCourse copyWith({
    String? id,
    String? libraryId,
    String? slug,
    String? title,
    DateTime? updatedAt,
    DateTime? cachedAt,
    String? payload,
  }) => CachedCourse(
    id: id ?? this.id,
    libraryId: libraryId ?? this.libraryId,
    slug: slug ?? this.slug,
    title: title ?? this.title,
    updatedAt: updatedAt ?? this.updatedAt,
    cachedAt: cachedAt ?? this.cachedAt,
    payload: payload ?? this.payload,
  );
  CachedCourse copyWithCompanion(CachedCoursesCompanion data) {
    return CachedCourse(
      id: data.id.present ? data.id.value : this.id,
      libraryId: data.libraryId.present ? data.libraryId.value : this.libraryId,
      slug: data.slug.present ? data.slug.value : this.slug,
      title: data.title.present ? data.title.value : this.title,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
      payload: data.payload.present ? data.payload.value : this.payload,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedCourse(')
          ..write('id: $id, ')
          ..write('libraryId: $libraryId, ')
          ..write('slug: $slug, ')
          ..write('title: $title, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('payload: $payload')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, libraryId, slug, title, updatedAt, cachedAt, payload);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedCourse &&
          other.id == this.id &&
          other.libraryId == this.libraryId &&
          other.slug == this.slug &&
          other.title == this.title &&
          other.updatedAt == this.updatedAt &&
          other.cachedAt == this.cachedAt &&
          other.payload == this.payload);
}

class CachedCoursesCompanion extends UpdateCompanion<CachedCourse> {
  final Value<String> id;
  final Value<String> libraryId;
  final Value<String> slug;
  final Value<String> title;
  final Value<DateTime> updatedAt;
  final Value<DateTime> cachedAt;
  final Value<String> payload;
  final Value<int> rowid;
  const CachedCoursesCompanion({
    this.id = const Value.absent(),
    this.libraryId = const Value.absent(),
    this.slug = const Value.absent(),
    this.title = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.payload = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedCoursesCompanion.insert({
    required String id,
    required String libraryId,
    required String slug,
    required String title,
    required DateTime updatedAt,
    required DateTime cachedAt,
    required String payload,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       libraryId = Value(libraryId),
       slug = Value(slug),
       title = Value(title),
       updatedAt = Value(updatedAt),
       cachedAt = Value(cachedAt),
       payload = Value(payload);
  static Insertable<CachedCourse> custom({
    Expression<String>? id,
    Expression<String>? libraryId,
    Expression<String>? slug,
    Expression<String>? title,
    Expression<DateTime>? updatedAt,
    Expression<DateTime>? cachedAt,
    Expression<String>? payload,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (libraryId != null) 'library_id': libraryId,
      if (slug != null) 'slug': slug,
      if (title != null) 'title': title,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (payload != null) 'payload': payload,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedCoursesCompanion copyWith({
    Value<String>? id,
    Value<String>? libraryId,
    Value<String>? slug,
    Value<String>? title,
    Value<DateTime>? updatedAt,
    Value<DateTime>? cachedAt,
    Value<String>? payload,
    Value<int>? rowid,
  }) {
    return CachedCoursesCompanion(
      id: id ?? this.id,
      libraryId: libraryId ?? this.libraryId,
      slug: slug ?? this.slug,
      title: title ?? this.title,
      updatedAt: updatedAt ?? this.updatedAt,
      cachedAt: cachedAt ?? this.cachedAt,
      payload: payload ?? this.payload,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (libraryId.present) {
      map['library_id'] = Variable<String>(libraryId.value);
    }
    if (slug.present) {
      map['slug'] = Variable<String>(slug.value);
    }
    if (title.present) {
      map['title'] = Variable<String>(title.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedCoursesCompanion(')
          ..write('id: $id, ')
          ..write('libraryId: $libraryId, ')
          ..write('slug: $slug, ')
          ..write('title: $title, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('payload: $payload, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedSectionsTable extends CachedSections
    with TableInfo<$CachedSectionsTable, CachedSection> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedSectionsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _courseIdMeta = const VerificationMeta(
    'courseId',
  );
  @override
  late final GeneratedColumn<String> courseId = GeneratedColumn<String>(
    'course_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES cached_courses (id) ON DELETE CASCADE',
    ),
  );
  static const VerificationMeta _positionMeta = const VerificationMeta(
    'position',
  );
  @override
  late final GeneratedColumn<int> position = GeneratedColumn<int>(
    'position',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    courseId,
    position,
    cachedAt,
    payload,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_sections';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedSection> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('course_id')) {
      context.handle(
        _courseIdMeta,
        courseId.isAcceptableOrUnknown(data['course_id']!, _courseIdMeta),
      );
    } else if (isInserting) {
      context.missing(_courseIdMeta);
    }
    if (data.containsKey('position')) {
      context.handle(
        _positionMeta,
        position.isAcceptableOrUnknown(data['position']!, _positionMeta),
      );
    } else if (isInserting) {
      context.missing(_positionMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedSection map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedSection(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      courseId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}course_id'],
      )!,
      position: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}position'],
      )!,
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
    );
  }

  @override
  $CachedSectionsTable createAlias(String alias) {
    return $CachedSectionsTable(attachedDatabase, alias);
  }
}

class CachedSection extends DataClass implements Insertable<CachedSection> {
  final String id;
  final String courseId;

  /// Ordering within the course outline.
  final int position;
  final DateTime cachedAt;

  /// The full section DTO as JSON.
  final String payload;
  const CachedSection({
    required this.id,
    required this.courseId,
    required this.position,
    required this.cachedAt,
    required this.payload,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['course_id'] = Variable<String>(courseId);
    map['position'] = Variable<int>(position);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    map['payload'] = Variable<String>(payload);
    return map;
  }

  CachedSectionsCompanion toCompanion(bool nullToAbsent) {
    return CachedSectionsCompanion(
      id: Value(id),
      courseId: Value(courseId),
      position: Value(position),
      cachedAt: Value(cachedAt),
      payload: Value(payload),
    );
  }

  factory CachedSection.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedSection(
      id: serializer.fromJson<String>(json['id']),
      courseId: serializer.fromJson<String>(json['courseId']),
      position: serializer.fromJson<int>(json['position']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
      payload: serializer.fromJson<String>(json['payload']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'courseId': serializer.toJson<String>(courseId),
      'position': serializer.toJson<int>(position),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
      'payload': serializer.toJson<String>(payload),
    };
  }

  CachedSection copyWith({
    String? id,
    String? courseId,
    int? position,
    DateTime? cachedAt,
    String? payload,
  }) => CachedSection(
    id: id ?? this.id,
    courseId: courseId ?? this.courseId,
    position: position ?? this.position,
    cachedAt: cachedAt ?? this.cachedAt,
    payload: payload ?? this.payload,
  );
  CachedSection copyWithCompanion(CachedSectionsCompanion data) {
    return CachedSection(
      id: data.id.present ? data.id.value : this.id,
      courseId: data.courseId.present ? data.courseId.value : this.courseId,
      position: data.position.present ? data.position.value : this.position,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
      payload: data.payload.present ? data.payload.value : this.payload,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedSection(')
          ..write('id: $id, ')
          ..write('courseId: $courseId, ')
          ..write('position: $position, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('payload: $payload')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, courseId, position, cachedAt, payload);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedSection &&
          other.id == this.id &&
          other.courseId == this.courseId &&
          other.position == this.position &&
          other.cachedAt == this.cachedAt &&
          other.payload == this.payload);
}

class CachedSectionsCompanion extends UpdateCompanion<CachedSection> {
  final Value<String> id;
  final Value<String> courseId;
  final Value<int> position;
  final Value<DateTime> cachedAt;
  final Value<String> payload;
  final Value<int> rowid;
  const CachedSectionsCompanion({
    this.id = const Value.absent(),
    this.courseId = const Value.absent(),
    this.position = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.payload = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedSectionsCompanion.insert({
    required String id,
    required String courseId,
    required int position,
    required DateTime cachedAt,
    required String payload,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       courseId = Value(courseId),
       position = Value(position),
       cachedAt = Value(cachedAt),
       payload = Value(payload);
  static Insertable<CachedSection> custom({
    Expression<String>? id,
    Expression<String>? courseId,
    Expression<int>? position,
    Expression<DateTime>? cachedAt,
    Expression<String>? payload,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (courseId != null) 'course_id': courseId,
      if (position != null) 'position': position,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (payload != null) 'payload': payload,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedSectionsCompanion copyWith({
    Value<String>? id,
    Value<String>? courseId,
    Value<int>? position,
    Value<DateTime>? cachedAt,
    Value<String>? payload,
    Value<int>? rowid,
  }) {
    return CachedSectionsCompanion(
      id: id ?? this.id,
      courseId: courseId ?? this.courseId,
      position: position ?? this.position,
      cachedAt: cachedAt ?? this.cachedAt,
      payload: payload ?? this.payload,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (courseId.present) {
      map['course_id'] = Variable<String>(courseId.value);
    }
    if (position.present) {
      map['position'] = Variable<int>(position.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedSectionsCompanion(')
          ..write('id: $id, ')
          ..write('courseId: $courseId, ')
          ..write('position: $position, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('payload: $payload, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $CachedLessonsTable extends CachedLessons
    with TableInfo<$CachedLessonsTable, CachedLesson> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $CachedLessonsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
    'id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _sectionIdMeta = const VerificationMeta(
    'sectionId',
  );
  @override
  late final GeneratedColumn<String> sectionId = GeneratedColumn<String>(
    'section_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES cached_sections (id) ON DELETE CASCADE',
    ),
  );
  static const VerificationMeta _courseIdMeta = const VerificationMeta(
    'courseId',
  );
  @override
  late final GeneratedColumn<String> courseId = GeneratedColumn<String>(
    'course_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
    defaultConstraints: GeneratedColumn.constraintIsAlways(
      'REFERENCES cached_courses (id) ON DELETE CASCADE',
    ),
  );
  static const VerificationMeta _positionMeta = const VerificationMeta(
    'position',
  );
  @override
  late final GeneratedColumn<int> position = GeneratedColumn<int>(
    'position',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _cachedAtMeta = const VerificationMeta(
    'cachedAt',
  );
  @override
  late final GeneratedColumn<DateTime> cachedAt = GeneratedColumn<DateTime>(
    'cached_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _payloadMeta = const VerificationMeta(
    'payload',
  );
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
    'payload',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    id,
    sectionId,
    courseId,
    position,
    cachedAt,
    payload,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'cached_lessons';
  @override
  VerificationContext validateIntegrity(
    Insertable<CachedLesson> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('section_id')) {
      context.handle(
        _sectionIdMeta,
        sectionId.isAcceptableOrUnknown(data['section_id']!, _sectionIdMeta),
      );
    } else if (isInserting) {
      context.missing(_sectionIdMeta);
    }
    if (data.containsKey('course_id')) {
      context.handle(
        _courseIdMeta,
        courseId.isAcceptableOrUnknown(data['course_id']!, _courseIdMeta),
      );
    } else if (isInserting) {
      context.missing(_courseIdMeta);
    }
    if (data.containsKey('position')) {
      context.handle(
        _positionMeta,
        position.isAcceptableOrUnknown(data['position']!, _positionMeta),
      );
    } else if (isInserting) {
      context.missing(_positionMeta);
    }
    if (data.containsKey('cached_at')) {
      context.handle(
        _cachedAtMeta,
        cachedAt.isAcceptableOrUnknown(data['cached_at']!, _cachedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_cachedAtMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(
        _payloadMeta,
        payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta),
      );
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  CachedLesson map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return CachedLesson(
      id: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}id'],
      )!,
      sectionId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}section_id'],
      )!,
      courseId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}course_id'],
      )!,
      position: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}position'],
      )!,
      cachedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}cached_at'],
      )!,
      payload: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}payload'],
      )!,
    );
  }

  @override
  $CachedLessonsTable createAlias(String alias) {
    return $CachedLessonsTable(attachedDatabase, alias);
  }
}

class CachedLesson extends DataClass implements Insertable<CachedLesson> {
  final String id;
  final String sectionId;

  /// Denormalised so "all lessons in a course" is one indexed read rather than
  /// a join through sections — Home and the downloads queue both need it.
  final String courseId;

  /// Ordering within the section.
  final int position;
  final DateTime cachedAt;

  /// The full lesson DTO as JSON.
  final String payload;
  const CachedLesson({
    required this.id,
    required this.sectionId,
    required this.courseId,
    required this.position,
    required this.cachedAt,
    required this.payload,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['section_id'] = Variable<String>(sectionId);
    map['course_id'] = Variable<String>(courseId);
    map['position'] = Variable<int>(position);
    map['cached_at'] = Variable<DateTime>(cachedAt);
    map['payload'] = Variable<String>(payload);
    return map;
  }

  CachedLessonsCompanion toCompanion(bool nullToAbsent) {
    return CachedLessonsCompanion(
      id: Value(id),
      sectionId: Value(sectionId),
      courseId: Value(courseId),
      position: Value(position),
      cachedAt: Value(cachedAt),
      payload: Value(payload),
    );
  }

  factory CachedLesson.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return CachedLesson(
      id: serializer.fromJson<String>(json['id']),
      sectionId: serializer.fromJson<String>(json['sectionId']),
      courseId: serializer.fromJson<String>(json['courseId']),
      position: serializer.fromJson<int>(json['position']),
      cachedAt: serializer.fromJson<DateTime>(json['cachedAt']),
      payload: serializer.fromJson<String>(json['payload']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'sectionId': serializer.toJson<String>(sectionId),
      'courseId': serializer.toJson<String>(courseId),
      'position': serializer.toJson<int>(position),
      'cachedAt': serializer.toJson<DateTime>(cachedAt),
      'payload': serializer.toJson<String>(payload),
    };
  }

  CachedLesson copyWith({
    String? id,
    String? sectionId,
    String? courseId,
    int? position,
    DateTime? cachedAt,
    String? payload,
  }) => CachedLesson(
    id: id ?? this.id,
    sectionId: sectionId ?? this.sectionId,
    courseId: courseId ?? this.courseId,
    position: position ?? this.position,
    cachedAt: cachedAt ?? this.cachedAt,
    payload: payload ?? this.payload,
  );
  CachedLesson copyWithCompanion(CachedLessonsCompanion data) {
    return CachedLesson(
      id: data.id.present ? data.id.value : this.id,
      sectionId: data.sectionId.present ? data.sectionId.value : this.sectionId,
      courseId: data.courseId.present ? data.courseId.value : this.courseId,
      position: data.position.present ? data.position.value : this.position,
      cachedAt: data.cachedAt.present ? data.cachedAt.value : this.cachedAt,
      payload: data.payload.present ? data.payload.value : this.payload,
    );
  }

  @override
  String toString() {
    return (StringBuffer('CachedLesson(')
          ..write('id: $id, ')
          ..write('sectionId: $sectionId, ')
          ..write('courseId: $courseId, ')
          ..write('position: $position, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('payload: $payload')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(id, sectionId, courseId, position, cachedAt, payload);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is CachedLesson &&
          other.id == this.id &&
          other.sectionId == this.sectionId &&
          other.courseId == this.courseId &&
          other.position == this.position &&
          other.cachedAt == this.cachedAt &&
          other.payload == this.payload);
}

class CachedLessonsCompanion extends UpdateCompanion<CachedLesson> {
  final Value<String> id;
  final Value<String> sectionId;
  final Value<String> courseId;
  final Value<int> position;
  final Value<DateTime> cachedAt;
  final Value<String> payload;
  final Value<int> rowid;
  const CachedLessonsCompanion({
    this.id = const Value.absent(),
    this.sectionId = const Value.absent(),
    this.courseId = const Value.absent(),
    this.position = const Value.absent(),
    this.cachedAt = const Value.absent(),
    this.payload = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  CachedLessonsCompanion.insert({
    required String id,
    required String sectionId,
    required String courseId,
    required int position,
    required DateTime cachedAt,
    required String payload,
    this.rowid = const Value.absent(),
  }) : id = Value(id),
       sectionId = Value(sectionId),
       courseId = Value(courseId),
       position = Value(position),
       cachedAt = Value(cachedAt),
       payload = Value(payload);
  static Insertable<CachedLesson> custom({
    Expression<String>? id,
    Expression<String>? sectionId,
    Expression<String>? courseId,
    Expression<int>? position,
    Expression<DateTime>? cachedAt,
    Expression<String>? payload,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (sectionId != null) 'section_id': sectionId,
      if (courseId != null) 'course_id': courseId,
      if (position != null) 'position': position,
      if (cachedAt != null) 'cached_at': cachedAt,
      if (payload != null) 'payload': payload,
      if (rowid != null) 'rowid': rowid,
    });
  }

  CachedLessonsCompanion copyWith({
    Value<String>? id,
    Value<String>? sectionId,
    Value<String>? courseId,
    Value<int>? position,
    Value<DateTime>? cachedAt,
    Value<String>? payload,
    Value<int>? rowid,
  }) {
    return CachedLessonsCompanion(
      id: id ?? this.id,
      sectionId: sectionId ?? this.sectionId,
      courseId: courseId ?? this.courseId,
      position: position ?? this.position,
      cachedAt: cachedAt ?? this.cachedAt,
      payload: payload ?? this.payload,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (sectionId.present) {
      map['section_id'] = Variable<String>(sectionId.value);
    }
    if (courseId.present) {
      map['course_id'] = Variable<String>(courseId.value);
    }
    if (position.present) {
      map['position'] = Variable<int>(position.value);
    }
    if (cachedAt.present) {
      map['cached_at'] = Variable<DateTime>(cachedAt.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('CachedLessonsCompanion(')
          ..write('id: $id, ')
          ..write('sectionId: $sectionId, ')
          ..write('courseId: $courseId, ')
          ..write('position: $position, ')
          ..write('cachedAt: $cachedAt, ')
          ..write('payload: $payload, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $ProgressOutboxTable extends ProgressOutbox
    with TableInfo<$ProgressOutboxTable, ProgressOutboxEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $ProgressOutboxTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _lessonIdMeta = const VerificationMeta(
    'lessonId',
  );
  @override
  late final GeneratedColumn<String> lessonId = GeneratedColumn<String>(
    'lesson_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _positionSecondsMeta = const VerificationMeta(
    'positionSeconds',
  );
  @override
  late final GeneratedColumn<int> positionSeconds = GeneratedColumn<int>(
    'position_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _durationSecondsMeta = const VerificationMeta(
    'durationSeconds',
  );
  @override
  late final GeneratedColumn<int> durationSeconds = GeneratedColumn<int>(
    'duration_seconds',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _clientUpdatedAtMeta = const VerificationMeta(
    'clientUpdatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> clientUpdatedAt =
      GeneratedColumn<DateTime>(
        'client_updated_at',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _queuedAtMeta = const VerificationMeta(
    'queuedAt',
  );
  @override
  late final GeneratedColumn<DateTime> queuedAt = GeneratedColumn<DateTime>(
    'queued_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    lessonId,
    positionSeconds,
    durationSeconds,
    clientUpdatedAt,
    queuedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'progress_outbox';
  @override
  VerificationContext validateIntegrity(
    Insertable<ProgressOutboxEntry> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('lesson_id')) {
      context.handle(
        _lessonIdMeta,
        lessonId.isAcceptableOrUnknown(data['lesson_id']!, _lessonIdMeta),
      );
    } else if (isInserting) {
      context.missing(_lessonIdMeta);
    }
    if (data.containsKey('position_seconds')) {
      context.handle(
        _positionSecondsMeta,
        positionSeconds.isAcceptableOrUnknown(
          data['position_seconds']!,
          _positionSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_positionSecondsMeta);
    }
    if (data.containsKey('duration_seconds')) {
      context.handle(
        _durationSecondsMeta,
        durationSeconds.isAcceptableOrUnknown(
          data['duration_seconds']!,
          _durationSecondsMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_durationSecondsMeta);
    }
    if (data.containsKey('client_updated_at')) {
      context.handle(
        _clientUpdatedAtMeta,
        clientUpdatedAt.isAcceptableOrUnknown(
          data['client_updated_at']!,
          _clientUpdatedAtMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_clientUpdatedAtMeta);
    }
    if (data.containsKey('queued_at')) {
      context.handle(
        _queuedAtMeta,
        queuedAt.isAcceptableOrUnknown(data['queued_at']!, _queuedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_queuedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {lessonId};
  @override
  ProgressOutboxEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return ProgressOutboxEntry(
      lessonId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}lesson_id'],
      )!,
      positionSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}position_seconds'],
      )!,
      durationSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}duration_seconds'],
      )!,
      clientUpdatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}client_updated_at'],
      )!,
      queuedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}queued_at'],
      )!,
    );
  }

  @override
  $ProgressOutboxTable createAlias(String alias) {
    return $ProgressOutboxTable(attachedDatabase, alias);
  }
}

class ProgressOutboxEntry extends DataClass
    implements Insertable<ProgressOutboxEntry> {
  /// Doubles as the coalescing key — the upsert target.
  final String lessonId;
  final int positionSeconds;
  final int durationSeconds;

  /// The USER-ACTION instant. The server compares this against its own
  /// `lastSeenAt` to detect staleness — it is not the enqueue time.
  final DateTime clientUpdatedAt;

  /// The ENQUEUE instant, for E20's chronological drain ordering. Distinct
  /// from [clientUpdatedAt]: only that one carries wire meaning.
  final DateTime queuedAt;
  const ProgressOutboxEntry({
    required this.lessonId,
    required this.positionSeconds,
    required this.durationSeconds,
    required this.clientUpdatedAt,
    required this.queuedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['lesson_id'] = Variable<String>(lessonId);
    map['position_seconds'] = Variable<int>(positionSeconds);
    map['duration_seconds'] = Variable<int>(durationSeconds);
    map['client_updated_at'] = Variable<DateTime>(clientUpdatedAt);
    map['queued_at'] = Variable<DateTime>(queuedAt);
    return map;
  }

  ProgressOutboxCompanion toCompanion(bool nullToAbsent) {
    return ProgressOutboxCompanion(
      lessonId: Value(lessonId),
      positionSeconds: Value(positionSeconds),
      durationSeconds: Value(durationSeconds),
      clientUpdatedAt: Value(clientUpdatedAt),
      queuedAt: Value(queuedAt),
    );
  }

  factory ProgressOutboxEntry.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return ProgressOutboxEntry(
      lessonId: serializer.fromJson<String>(json['lessonId']),
      positionSeconds: serializer.fromJson<int>(json['positionSeconds']),
      durationSeconds: serializer.fromJson<int>(json['durationSeconds']),
      clientUpdatedAt: serializer.fromJson<DateTime>(json['clientUpdatedAt']),
      queuedAt: serializer.fromJson<DateTime>(json['queuedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'lessonId': serializer.toJson<String>(lessonId),
      'positionSeconds': serializer.toJson<int>(positionSeconds),
      'durationSeconds': serializer.toJson<int>(durationSeconds),
      'clientUpdatedAt': serializer.toJson<DateTime>(clientUpdatedAt),
      'queuedAt': serializer.toJson<DateTime>(queuedAt),
    };
  }

  ProgressOutboxEntry copyWith({
    String? lessonId,
    int? positionSeconds,
    int? durationSeconds,
    DateTime? clientUpdatedAt,
    DateTime? queuedAt,
  }) => ProgressOutboxEntry(
    lessonId: lessonId ?? this.lessonId,
    positionSeconds: positionSeconds ?? this.positionSeconds,
    durationSeconds: durationSeconds ?? this.durationSeconds,
    clientUpdatedAt: clientUpdatedAt ?? this.clientUpdatedAt,
    queuedAt: queuedAt ?? this.queuedAt,
  );
  ProgressOutboxEntry copyWithCompanion(ProgressOutboxCompanion data) {
    return ProgressOutboxEntry(
      lessonId: data.lessonId.present ? data.lessonId.value : this.lessonId,
      positionSeconds: data.positionSeconds.present
          ? data.positionSeconds.value
          : this.positionSeconds,
      durationSeconds: data.durationSeconds.present
          ? data.durationSeconds.value
          : this.durationSeconds,
      clientUpdatedAt: data.clientUpdatedAt.present
          ? data.clientUpdatedAt.value
          : this.clientUpdatedAt,
      queuedAt: data.queuedAt.present ? data.queuedAt.value : this.queuedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('ProgressOutboxEntry(')
          ..write('lessonId: $lessonId, ')
          ..write('positionSeconds: $positionSeconds, ')
          ..write('durationSeconds: $durationSeconds, ')
          ..write('clientUpdatedAt: $clientUpdatedAt, ')
          ..write('queuedAt: $queuedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    lessonId,
    positionSeconds,
    durationSeconds,
    clientUpdatedAt,
    queuedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is ProgressOutboxEntry &&
          other.lessonId == this.lessonId &&
          other.positionSeconds == this.positionSeconds &&
          other.durationSeconds == this.durationSeconds &&
          other.clientUpdatedAt == this.clientUpdatedAt &&
          other.queuedAt == this.queuedAt);
}

class ProgressOutboxCompanion extends UpdateCompanion<ProgressOutboxEntry> {
  final Value<String> lessonId;
  final Value<int> positionSeconds;
  final Value<int> durationSeconds;
  final Value<DateTime> clientUpdatedAt;
  final Value<DateTime> queuedAt;
  final Value<int> rowid;
  const ProgressOutboxCompanion({
    this.lessonId = const Value.absent(),
    this.positionSeconds = const Value.absent(),
    this.durationSeconds = const Value.absent(),
    this.clientUpdatedAt = const Value.absent(),
    this.queuedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  ProgressOutboxCompanion.insert({
    required String lessonId,
    required int positionSeconds,
    required int durationSeconds,
    required DateTime clientUpdatedAt,
    required DateTime queuedAt,
    this.rowid = const Value.absent(),
  }) : lessonId = Value(lessonId),
       positionSeconds = Value(positionSeconds),
       durationSeconds = Value(durationSeconds),
       clientUpdatedAt = Value(clientUpdatedAt),
       queuedAt = Value(queuedAt);
  static Insertable<ProgressOutboxEntry> custom({
    Expression<String>? lessonId,
    Expression<int>? positionSeconds,
    Expression<int>? durationSeconds,
    Expression<DateTime>? clientUpdatedAt,
    Expression<DateTime>? queuedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (lessonId != null) 'lesson_id': lessonId,
      if (positionSeconds != null) 'position_seconds': positionSeconds,
      if (durationSeconds != null) 'duration_seconds': durationSeconds,
      if (clientUpdatedAt != null) 'client_updated_at': clientUpdatedAt,
      if (queuedAt != null) 'queued_at': queuedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  ProgressOutboxCompanion copyWith({
    Value<String>? lessonId,
    Value<int>? positionSeconds,
    Value<int>? durationSeconds,
    Value<DateTime>? clientUpdatedAt,
    Value<DateTime>? queuedAt,
    Value<int>? rowid,
  }) {
    return ProgressOutboxCompanion(
      lessonId: lessonId ?? this.lessonId,
      positionSeconds: positionSeconds ?? this.positionSeconds,
      durationSeconds: durationSeconds ?? this.durationSeconds,
      clientUpdatedAt: clientUpdatedAt ?? this.clientUpdatedAt,
      queuedAt: queuedAt ?? this.queuedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (lessonId.present) {
      map['lesson_id'] = Variable<String>(lessonId.value);
    }
    if (positionSeconds.present) {
      map['position_seconds'] = Variable<int>(positionSeconds.value);
    }
    if (durationSeconds.present) {
      map['duration_seconds'] = Variable<int>(durationSeconds.value);
    }
    if (clientUpdatedAt.present) {
      map['client_updated_at'] = Variable<DateTime>(clientUpdatedAt.value);
    }
    if (queuedAt.present) {
      map['queued_at'] = Variable<DateTime>(queuedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('ProgressOutboxCompanion(')
          ..write('lessonId: $lessonId, ')
          ..write('positionSeconds: $positionSeconds, ')
          ..write('durationSeconds: $durationSeconds, ')
          ..write('clientUpdatedAt: $clientUpdatedAt, ')
          ..write('queuedAt: $queuedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $NotesOutboxTable extends NotesOutbox
    with TableInfo<$NotesOutboxTable, NotesOutboxEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $NotesOutboxTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _lessonIdMeta = const VerificationMeta(
    'lessonId',
  );
  @override
  late final GeneratedColumn<String> lessonId = GeneratedColumn<String>(
    'lesson_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<OutboxOp, String> op =
      GeneratedColumn<String>(
        'op',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<OutboxOp>($NotesOutboxTable.$converterop);
  static const VerificationMeta _bodyMeta = const VerificationMeta('body');
  @override
  late final GeneratedColumn<String> body = GeneratedColumn<String>(
    'body',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _clientUpdatedAtMeta = const VerificationMeta(
    'clientUpdatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> clientUpdatedAt =
      GeneratedColumn<DateTime>(
        'client_updated_at',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _queuedAtMeta = const VerificationMeta(
    'queuedAt',
  );
  @override
  late final GeneratedColumn<DateTime> queuedAt = GeneratedColumn<DateTime>(
    'queued_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    lessonId,
    op,
    body,
    clientUpdatedAt,
    queuedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'notes_outbox';
  @override
  VerificationContext validateIntegrity(
    Insertable<NotesOutboxEntry> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('lesson_id')) {
      context.handle(
        _lessonIdMeta,
        lessonId.isAcceptableOrUnknown(data['lesson_id']!, _lessonIdMeta),
      );
    } else if (isInserting) {
      context.missing(_lessonIdMeta);
    }
    if (data.containsKey('body')) {
      context.handle(
        _bodyMeta,
        body.isAcceptableOrUnknown(data['body']!, _bodyMeta),
      );
    }
    if (data.containsKey('client_updated_at')) {
      context.handle(
        _clientUpdatedAtMeta,
        clientUpdatedAt.isAcceptableOrUnknown(
          data['client_updated_at']!,
          _clientUpdatedAtMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_clientUpdatedAtMeta);
    }
    if (data.containsKey('queued_at')) {
      context.handle(
        _queuedAtMeta,
        queuedAt.isAcceptableOrUnknown(data['queued_at']!, _queuedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_queuedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {lessonId};
  @override
  NotesOutboxEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return NotesOutboxEntry(
      lessonId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}lesson_id'],
      )!,
      op: $NotesOutboxTable.$converterop.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}op'],
        )!,
      ),
      body: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}body'],
      ),
      clientUpdatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}client_updated_at'],
      )!,
      queuedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}queued_at'],
      )!,
    );
  }

  @override
  $NotesOutboxTable createAlias(String alias) {
    return $NotesOutboxTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<OutboxOp, String, String> $converterop =
      const EnumNameConverter<OutboxOp>(OutboxOp.values);
}

class NotesOutboxEntry extends DataClass
    implements Insertable<NotesOutboxEntry> {
  /// Doubles as the coalescing key.
  final String lessonId;

  /// Only `update` (→ PUT) and `delete` (→ DELETE) are reachable here; notes
  /// have no distinct create — `PUT /notes` upserts.
  final OutboxOp op;

  /// Null when [op] is delete.
  final String? body;
  final DateTime clientUpdatedAt;
  final DateTime queuedAt;
  const NotesOutboxEntry({
    required this.lessonId,
    required this.op,
    this.body,
    required this.clientUpdatedAt,
    required this.queuedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['lesson_id'] = Variable<String>(lessonId);
    {
      map['op'] = Variable<String>($NotesOutboxTable.$converterop.toSql(op));
    }
    if (!nullToAbsent || body != null) {
      map['body'] = Variable<String>(body);
    }
    map['client_updated_at'] = Variable<DateTime>(clientUpdatedAt);
    map['queued_at'] = Variable<DateTime>(queuedAt);
    return map;
  }

  NotesOutboxCompanion toCompanion(bool nullToAbsent) {
    return NotesOutboxCompanion(
      lessonId: Value(lessonId),
      op: Value(op),
      body: body == null && nullToAbsent ? const Value.absent() : Value(body),
      clientUpdatedAt: Value(clientUpdatedAt),
      queuedAt: Value(queuedAt),
    );
  }

  factory NotesOutboxEntry.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return NotesOutboxEntry(
      lessonId: serializer.fromJson<String>(json['lessonId']),
      op: $NotesOutboxTable.$converterop.fromJson(
        serializer.fromJson<String>(json['op']),
      ),
      body: serializer.fromJson<String?>(json['body']),
      clientUpdatedAt: serializer.fromJson<DateTime>(json['clientUpdatedAt']),
      queuedAt: serializer.fromJson<DateTime>(json['queuedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'lessonId': serializer.toJson<String>(lessonId),
      'op': serializer.toJson<String>(
        $NotesOutboxTable.$converterop.toJson(op),
      ),
      'body': serializer.toJson<String?>(body),
      'clientUpdatedAt': serializer.toJson<DateTime>(clientUpdatedAt),
      'queuedAt': serializer.toJson<DateTime>(queuedAt),
    };
  }

  NotesOutboxEntry copyWith({
    String? lessonId,
    OutboxOp? op,
    Value<String?> body = const Value.absent(),
    DateTime? clientUpdatedAt,
    DateTime? queuedAt,
  }) => NotesOutboxEntry(
    lessonId: lessonId ?? this.lessonId,
    op: op ?? this.op,
    body: body.present ? body.value : this.body,
    clientUpdatedAt: clientUpdatedAt ?? this.clientUpdatedAt,
    queuedAt: queuedAt ?? this.queuedAt,
  );
  NotesOutboxEntry copyWithCompanion(NotesOutboxCompanion data) {
    return NotesOutboxEntry(
      lessonId: data.lessonId.present ? data.lessonId.value : this.lessonId,
      op: data.op.present ? data.op.value : this.op,
      body: data.body.present ? data.body.value : this.body,
      clientUpdatedAt: data.clientUpdatedAt.present
          ? data.clientUpdatedAt.value
          : this.clientUpdatedAt,
      queuedAt: data.queuedAt.present ? data.queuedAt.value : this.queuedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('NotesOutboxEntry(')
          ..write('lessonId: $lessonId, ')
          ..write('op: $op, ')
          ..write('body: $body, ')
          ..write('clientUpdatedAt: $clientUpdatedAt, ')
          ..write('queuedAt: $queuedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode =>
      Object.hash(lessonId, op, body, clientUpdatedAt, queuedAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is NotesOutboxEntry &&
          other.lessonId == this.lessonId &&
          other.op == this.op &&
          other.body == this.body &&
          other.clientUpdatedAt == this.clientUpdatedAt &&
          other.queuedAt == this.queuedAt);
}

class NotesOutboxCompanion extends UpdateCompanion<NotesOutboxEntry> {
  final Value<String> lessonId;
  final Value<OutboxOp> op;
  final Value<String?> body;
  final Value<DateTime> clientUpdatedAt;
  final Value<DateTime> queuedAt;
  final Value<int> rowid;
  const NotesOutboxCompanion({
    this.lessonId = const Value.absent(),
    this.op = const Value.absent(),
    this.body = const Value.absent(),
    this.clientUpdatedAt = const Value.absent(),
    this.queuedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  NotesOutboxCompanion.insert({
    required String lessonId,
    required OutboxOp op,
    this.body = const Value.absent(),
    required DateTime clientUpdatedAt,
    required DateTime queuedAt,
    this.rowid = const Value.absent(),
  }) : lessonId = Value(lessonId),
       op = Value(op),
       clientUpdatedAt = Value(clientUpdatedAt),
       queuedAt = Value(queuedAt);
  static Insertable<NotesOutboxEntry> custom({
    Expression<String>? lessonId,
    Expression<String>? op,
    Expression<String>? body,
    Expression<DateTime>? clientUpdatedAt,
    Expression<DateTime>? queuedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (lessonId != null) 'lesson_id': lessonId,
      if (op != null) 'op': op,
      if (body != null) 'body': body,
      if (clientUpdatedAt != null) 'client_updated_at': clientUpdatedAt,
      if (queuedAt != null) 'queued_at': queuedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  NotesOutboxCompanion copyWith({
    Value<String>? lessonId,
    Value<OutboxOp>? op,
    Value<String?>? body,
    Value<DateTime>? clientUpdatedAt,
    Value<DateTime>? queuedAt,
    Value<int>? rowid,
  }) {
    return NotesOutboxCompanion(
      lessonId: lessonId ?? this.lessonId,
      op: op ?? this.op,
      body: body ?? this.body,
      clientUpdatedAt: clientUpdatedAt ?? this.clientUpdatedAt,
      queuedAt: queuedAt ?? this.queuedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (lessonId.present) {
      map['lesson_id'] = Variable<String>(lessonId.value);
    }
    if (op.present) {
      map['op'] = Variable<String>(
        $NotesOutboxTable.$converterop.toSql(op.value),
      );
    }
    if (body.present) {
      map['body'] = Variable<String>(body.value);
    }
    if (clientUpdatedAt.present) {
      map['client_updated_at'] = Variable<DateTime>(clientUpdatedAt.value);
    }
    if (queuedAt.present) {
      map['queued_at'] = Variable<DateTime>(queuedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('NotesOutboxCompanion(')
          ..write('lessonId: $lessonId, ')
          ..write('op: $op, ')
          ..write('body: $body, ')
          ..write('clientUpdatedAt: $clientUpdatedAt, ')
          ..write('queuedAt: $queuedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $BookmarksOutboxTable extends BookmarksOutbox
    with TableInfo<$BookmarksOutboxTable, BookmarksOutboxEntry> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $BookmarksOutboxTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _localIdMeta = const VerificationMeta(
    'localId',
  );
  @override
  late final GeneratedColumn<String> localId = GeneratedColumn<String>(
    'local_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _serverIdMeta = const VerificationMeta(
    'serverId',
  );
  @override
  late final GeneratedColumn<String> serverId = GeneratedColumn<String>(
    'server_id',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lessonIdMeta = const VerificationMeta(
    'lessonId',
  );
  @override
  late final GeneratedColumn<String> lessonId = GeneratedColumn<String>(
    'lesson_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<OutboxOp, String> op =
      GeneratedColumn<String>(
        'op',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<OutboxOp>($BookmarksOutboxTable.$converterop);
  static const VerificationMeta _positionSecondsMeta = const VerificationMeta(
    'positionSeconds',
  );
  @override
  late final GeneratedColumn<int> positionSeconds = GeneratedColumn<int>(
    'position_seconds',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _labelMeta = const VerificationMeta('label');
  @override
  late final GeneratedColumn<String> label = GeneratedColumn<String>(
    'label',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _clientUpdatedAtMeta = const VerificationMeta(
    'clientUpdatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> clientUpdatedAt =
      GeneratedColumn<DateTime>(
        'client_updated_at',
        aliasedName,
        false,
        type: DriftSqlType.dateTime,
        requiredDuringInsert: true,
      );
  static const VerificationMeta _queuedAtMeta = const VerificationMeta(
    'queuedAt',
  );
  @override
  late final GeneratedColumn<DateTime> queuedAt = GeneratedColumn<DateTime>(
    'queued_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    localId,
    serverId,
    lessonId,
    op,
    positionSeconds,
    label,
    clientUpdatedAt,
    queuedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'bookmarks_outbox';
  @override
  VerificationContext validateIntegrity(
    Insertable<BookmarksOutboxEntry> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('local_id')) {
      context.handle(
        _localIdMeta,
        localId.isAcceptableOrUnknown(data['local_id']!, _localIdMeta),
      );
    } else if (isInserting) {
      context.missing(_localIdMeta);
    }
    if (data.containsKey('server_id')) {
      context.handle(
        _serverIdMeta,
        serverId.isAcceptableOrUnknown(data['server_id']!, _serverIdMeta),
      );
    }
    if (data.containsKey('lesson_id')) {
      context.handle(
        _lessonIdMeta,
        lessonId.isAcceptableOrUnknown(data['lesson_id']!, _lessonIdMeta),
      );
    } else if (isInserting) {
      context.missing(_lessonIdMeta);
    }
    if (data.containsKey('position_seconds')) {
      context.handle(
        _positionSecondsMeta,
        positionSeconds.isAcceptableOrUnknown(
          data['position_seconds']!,
          _positionSecondsMeta,
        ),
      );
    }
    if (data.containsKey('label')) {
      context.handle(
        _labelMeta,
        label.isAcceptableOrUnknown(data['label']!, _labelMeta),
      );
    }
    if (data.containsKey('client_updated_at')) {
      context.handle(
        _clientUpdatedAtMeta,
        clientUpdatedAt.isAcceptableOrUnknown(
          data['client_updated_at']!,
          _clientUpdatedAtMeta,
        ),
      );
    } else if (isInserting) {
      context.missing(_clientUpdatedAtMeta);
    }
    if (data.containsKey('queued_at')) {
      context.handle(
        _queuedAtMeta,
        queuedAt.isAcceptableOrUnknown(data['queued_at']!, _queuedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_queuedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {localId};
  @override
  BookmarksOutboxEntry map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return BookmarksOutboxEntry(
      localId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}local_id'],
      )!,
      serverId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}server_id'],
      ),
      lessonId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}lesson_id'],
      )!,
      op: $BookmarksOutboxTable.$converterop.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}op'],
        )!,
      ),
      positionSeconds: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}position_seconds'],
      ),
      label: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}label'],
      ),
      clientUpdatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}client_updated_at'],
      )!,
      queuedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}queued_at'],
      )!,
    );
  }

  @override
  $BookmarksOutboxTable createAlias(String alias) {
    return $BookmarksOutboxTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<OutboxOp, String, String> $converterop =
      const EnumNameConverter<OutboxOp>(OutboxOp.values);
}

class BookmarksOutboxEntry extends DataClass
    implements Insertable<BookmarksOutboxEntry> {
  /// Client-generated. Stable across the collapse; never sent to the server.
  final String localId;

  /// The server-assigned id. Null until the create for this [localId] syncs —
  /// nullability IS the collapse contract, so do not make this required.
  final String? serverId;
  final String lessonId;
  final OutboxOp op;

  /// Null when [op] is delete.
  final int? positionSeconds;

  /// Null when [op] is delete, or when the bookmark has no label. Update rows
  /// carry the bookmark's FULL desired state, not a patch — so a null label on
  /// an update means "clear the label", which the drain sends as an explicit
  /// null.
  final String? label;
  final DateTime clientUpdatedAt;
  final DateTime queuedAt;
  const BookmarksOutboxEntry({
    required this.localId,
    this.serverId,
    required this.lessonId,
    required this.op,
    this.positionSeconds,
    this.label,
    required this.clientUpdatedAt,
    required this.queuedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['local_id'] = Variable<String>(localId);
    if (!nullToAbsent || serverId != null) {
      map['server_id'] = Variable<String>(serverId);
    }
    map['lesson_id'] = Variable<String>(lessonId);
    {
      map['op'] = Variable<String>(
        $BookmarksOutboxTable.$converterop.toSql(op),
      );
    }
    if (!nullToAbsent || positionSeconds != null) {
      map['position_seconds'] = Variable<int>(positionSeconds);
    }
    if (!nullToAbsent || label != null) {
      map['label'] = Variable<String>(label);
    }
    map['client_updated_at'] = Variable<DateTime>(clientUpdatedAt);
    map['queued_at'] = Variable<DateTime>(queuedAt);
    return map;
  }

  BookmarksOutboxCompanion toCompanion(bool nullToAbsent) {
    return BookmarksOutboxCompanion(
      localId: Value(localId),
      serverId: serverId == null && nullToAbsent
          ? const Value.absent()
          : Value(serverId),
      lessonId: Value(lessonId),
      op: Value(op),
      positionSeconds: positionSeconds == null && nullToAbsent
          ? const Value.absent()
          : Value(positionSeconds),
      label: label == null && nullToAbsent
          ? const Value.absent()
          : Value(label),
      clientUpdatedAt: Value(clientUpdatedAt),
      queuedAt: Value(queuedAt),
    );
  }

  factory BookmarksOutboxEntry.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return BookmarksOutboxEntry(
      localId: serializer.fromJson<String>(json['localId']),
      serverId: serializer.fromJson<String?>(json['serverId']),
      lessonId: serializer.fromJson<String>(json['lessonId']),
      op: $BookmarksOutboxTable.$converterop.fromJson(
        serializer.fromJson<String>(json['op']),
      ),
      positionSeconds: serializer.fromJson<int?>(json['positionSeconds']),
      label: serializer.fromJson<String?>(json['label']),
      clientUpdatedAt: serializer.fromJson<DateTime>(json['clientUpdatedAt']),
      queuedAt: serializer.fromJson<DateTime>(json['queuedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'localId': serializer.toJson<String>(localId),
      'serverId': serializer.toJson<String?>(serverId),
      'lessonId': serializer.toJson<String>(lessonId),
      'op': serializer.toJson<String>(
        $BookmarksOutboxTable.$converterop.toJson(op),
      ),
      'positionSeconds': serializer.toJson<int?>(positionSeconds),
      'label': serializer.toJson<String?>(label),
      'clientUpdatedAt': serializer.toJson<DateTime>(clientUpdatedAt),
      'queuedAt': serializer.toJson<DateTime>(queuedAt),
    };
  }

  BookmarksOutboxEntry copyWith({
    String? localId,
    Value<String?> serverId = const Value.absent(),
    String? lessonId,
    OutboxOp? op,
    Value<int?> positionSeconds = const Value.absent(),
    Value<String?> label = const Value.absent(),
    DateTime? clientUpdatedAt,
    DateTime? queuedAt,
  }) => BookmarksOutboxEntry(
    localId: localId ?? this.localId,
    serverId: serverId.present ? serverId.value : this.serverId,
    lessonId: lessonId ?? this.lessonId,
    op: op ?? this.op,
    positionSeconds: positionSeconds.present
        ? positionSeconds.value
        : this.positionSeconds,
    label: label.present ? label.value : this.label,
    clientUpdatedAt: clientUpdatedAt ?? this.clientUpdatedAt,
    queuedAt: queuedAt ?? this.queuedAt,
  );
  BookmarksOutboxEntry copyWithCompanion(BookmarksOutboxCompanion data) {
    return BookmarksOutboxEntry(
      localId: data.localId.present ? data.localId.value : this.localId,
      serverId: data.serverId.present ? data.serverId.value : this.serverId,
      lessonId: data.lessonId.present ? data.lessonId.value : this.lessonId,
      op: data.op.present ? data.op.value : this.op,
      positionSeconds: data.positionSeconds.present
          ? data.positionSeconds.value
          : this.positionSeconds,
      label: data.label.present ? data.label.value : this.label,
      clientUpdatedAt: data.clientUpdatedAt.present
          ? data.clientUpdatedAt.value
          : this.clientUpdatedAt,
      queuedAt: data.queuedAt.present ? data.queuedAt.value : this.queuedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('BookmarksOutboxEntry(')
          ..write('localId: $localId, ')
          ..write('serverId: $serverId, ')
          ..write('lessonId: $lessonId, ')
          ..write('op: $op, ')
          ..write('positionSeconds: $positionSeconds, ')
          ..write('label: $label, ')
          ..write('clientUpdatedAt: $clientUpdatedAt, ')
          ..write('queuedAt: $queuedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    localId,
    serverId,
    lessonId,
    op,
    positionSeconds,
    label,
    clientUpdatedAt,
    queuedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is BookmarksOutboxEntry &&
          other.localId == this.localId &&
          other.serverId == this.serverId &&
          other.lessonId == this.lessonId &&
          other.op == this.op &&
          other.positionSeconds == this.positionSeconds &&
          other.label == this.label &&
          other.clientUpdatedAt == this.clientUpdatedAt &&
          other.queuedAt == this.queuedAt);
}

class BookmarksOutboxCompanion extends UpdateCompanion<BookmarksOutboxEntry> {
  final Value<String> localId;
  final Value<String?> serverId;
  final Value<String> lessonId;
  final Value<OutboxOp> op;
  final Value<int?> positionSeconds;
  final Value<String?> label;
  final Value<DateTime> clientUpdatedAt;
  final Value<DateTime> queuedAt;
  final Value<int> rowid;
  const BookmarksOutboxCompanion({
    this.localId = const Value.absent(),
    this.serverId = const Value.absent(),
    this.lessonId = const Value.absent(),
    this.op = const Value.absent(),
    this.positionSeconds = const Value.absent(),
    this.label = const Value.absent(),
    this.clientUpdatedAt = const Value.absent(),
    this.queuedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  BookmarksOutboxCompanion.insert({
    required String localId,
    this.serverId = const Value.absent(),
    required String lessonId,
    required OutboxOp op,
    this.positionSeconds = const Value.absent(),
    this.label = const Value.absent(),
    required DateTime clientUpdatedAt,
    required DateTime queuedAt,
    this.rowid = const Value.absent(),
  }) : localId = Value(localId),
       lessonId = Value(lessonId),
       op = Value(op),
       clientUpdatedAt = Value(clientUpdatedAt),
       queuedAt = Value(queuedAt);
  static Insertable<BookmarksOutboxEntry> custom({
    Expression<String>? localId,
    Expression<String>? serverId,
    Expression<String>? lessonId,
    Expression<String>? op,
    Expression<int>? positionSeconds,
    Expression<String>? label,
    Expression<DateTime>? clientUpdatedAt,
    Expression<DateTime>? queuedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (localId != null) 'local_id': localId,
      if (serverId != null) 'server_id': serverId,
      if (lessonId != null) 'lesson_id': lessonId,
      if (op != null) 'op': op,
      if (positionSeconds != null) 'position_seconds': positionSeconds,
      if (label != null) 'label': label,
      if (clientUpdatedAt != null) 'client_updated_at': clientUpdatedAt,
      if (queuedAt != null) 'queued_at': queuedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  BookmarksOutboxCompanion copyWith({
    Value<String>? localId,
    Value<String?>? serverId,
    Value<String>? lessonId,
    Value<OutboxOp>? op,
    Value<int?>? positionSeconds,
    Value<String?>? label,
    Value<DateTime>? clientUpdatedAt,
    Value<DateTime>? queuedAt,
    Value<int>? rowid,
  }) {
    return BookmarksOutboxCompanion(
      localId: localId ?? this.localId,
      serverId: serverId ?? this.serverId,
      lessonId: lessonId ?? this.lessonId,
      op: op ?? this.op,
      positionSeconds: positionSeconds ?? this.positionSeconds,
      label: label ?? this.label,
      clientUpdatedAt: clientUpdatedAt ?? this.clientUpdatedAt,
      queuedAt: queuedAt ?? this.queuedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (localId.present) {
      map['local_id'] = Variable<String>(localId.value);
    }
    if (serverId.present) {
      map['server_id'] = Variable<String>(serverId.value);
    }
    if (lessonId.present) {
      map['lesson_id'] = Variable<String>(lessonId.value);
    }
    if (op.present) {
      map['op'] = Variable<String>(
        $BookmarksOutboxTable.$converterop.toSql(op.value),
      );
    }
    if (positionSeconds.present) {
      map['position_seconds'] = Variable<int>(positionSeconds.value);
    }
    if (label.present) {
      map['label'] = Variable<String>(label.value);
    }
    if (clientUpdatedAt.present) {
      map['client_updated_at'] = Variable<DateTime>(clientUpdatedAt.value);
    }
    if (queuedAt.present) {
      map['queued_at'] = Variable<DateTime>(queuedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('BookmarksOutboxCompanion(')
          ..write('localId: $localId, ')
          ..write('serverId: $serverId, ')
          ..write('lessonId: $lessonId, ')
          ..write('op: $op, ')
          ..write('positionSeconds: $positionSeconds, ')
          ..write('label: $label, ')
          ..write('clientUpdatedAt: $clientUpdatedAt, ')
          ..write('queuedAt: $queuedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

class $DownloadedLessonsTable extends DownloadedLessons
    with TableInfo<$DownloadedLessonsTable, DownloadedLesson> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $DownloadedLessonsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _lessonIdMeta = const VerificationMeta(
    'lessonId',
  );
  @override
  late final GeneratedColumn<String> lessonId = GeneratedColumn<String>(
    'lesson_id',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  @override
  late final GeneratedColumnWithTypeConverter<DownloadState, String> state =
      GeneratedColumn<String>(
        'state',
        aliasedName,
        false,
        type: DriftSqlType.string,
        requiredDuringInsert: true,
      ).withConverter<DownloadState>($DownloadedLessonsTable.$converterstate);
  static const VerificationMeta _filePathMeta = const VerificationMeta(
    'filePath',
  );
  @override
  late final GeneratedColumn<String> filePath = GeneratedColumn<String>(
    'file_path',
    aliasedName,
    false,
    type: DriftSqlType.string,
    requiredDuringInsert: true,
  );
  static const VerificationMeta _bytesDownloadedMeta = const VerificationMeta(
    'bytesDownloaded',
  );
  @override
  late final GeneratedColumn<int> bytesDownloaded = GeneratedColumn<int>(
    'bytes_downloaded',
    aliasedName,
    false,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
    defaultValue: const Constant(0),
  );
  static const VerificationMeta _totalBytesMeta = const VerificationMeta(
    'totalBytes',
  );
  @override
  late final GeneratedColumn<int> totalBytes = GeneratedColumn<int>(
    'total_bytes',
    aliasedName,
    true,
    type: DriftSqlType.int,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _nonceMeta = const VerificationMeta('nonce');
  @override
  late final GeneratedColumn<Uint8List> nonce = GeneratedColumn<Uint8List>(
    'nonce',
    aliasedName,
    true,
    type: DriftSqlType.blob,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _lastErrorMeta = const VerificationMeta(
    'lastError',
  );
  @override
  late final GeneratedColumn<String> lastError = GeneratedColumn<String>(
    'last_error',
    aliasedName,
    true,
    type: DriftSqlType.string,
    requiredDuringInsert: false,
  );
  static const VerificationMeta _updatedAtMeta = const VerificationMeta(
    'updatedAt',
  );
  @override
  late final GeneratedColumn<DateTime> updatedAt = GeneratedColumn<DateTime>(
    'updated_at',
    aliasedName,
    false,
    type: DriftSqlType.dateTime,
    requiredDuringInsert: true,
  );
  @override
  List<GeneratedColumn> get $columns => [
    lessonId,
    state,
    filePath,
    bytesDownloaded,
    totalBytes,
    nonce,
    lastError,
    updatedAt,
  ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'downloaded_lessons';
  @override
  VerificationContext validateIntegrity(
    Insertable<DownloadedLesson> instance, {
    bool isInserting = false,
  }) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('lesson_id')) {
      context.handle(
        _lessonIdMeta,
        lessonId.isAcceptableOrUnknown(data['lesson_id']!, _lessonIdMeta),
      );
    } else if (isInserting) {
      context.missing(_lessonIdMeta);
    }
    if (data.containsKey('file_path')) {
      context.handle(
        _filePathMeta,
        filePath.isAcceptableOrUnknown(data['file_path']!, _filePathMeta),
      );
    } else if (isInserting) {
      context.missing(_filePathMeta);
    }
    if (data.containsKey('bytes_downloaded')) {
      context.handle(
        _bytesDownloadedMeta,
        bytesDownloaded.isAcceptableOrUnknown(
          data['bytes_downloaded']!,
          _bytesDownloadedMeta,
        ),
      );
    }
    if (data.containsKey('total_bytes')) {
      context.handle(
        _totalBytesMeta,
        totalBytes.isAcceptableOrUnknown(data['total_bytes']!, _totalBytesMeta),
      );
    }
    if (data.containsKey('nonce')) {
      context.handle(
        _nonceMeta,
        nonce.isAcceptableOrUnknown(data['nonce']!, _nonceMeta),
      );
    }
    if (data.containsKey('last_error')) {
      context.handle(
        _lastErrorMeta,
        lastError.isAcceptableOrUnknown(data['last_error']!, _lastErrorMeta),
      );
    }
    if (data.containsKey('updated_at')) {
      context.handle(
        _updatedAtMeta,
        updatedAt.isAcceptableOrUnknown(data['updated_at']!, _updatedAtMeta),
      );
    } else if (isInserting) {
      context.missing(_updatedAtMeta);
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {lessonId};
  @override
  DownloadedLesson map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return DownloadedLesson(
      lessonId: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}lesson_id'],
      )!,
      state: $DownloadedLessonsTable.$converterstate.fromSql(
        attachedDatabase.typeMapping.read(
          DriftSqlType.string,
          data['${effectivePrefix}state'],
        )!,
      ),
      filePath: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}file_path'],
      )!,
      bytesDownloaded: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}bytes_downloaded'],
      )!,
      totalBytes: attachedDatabase.typeMapping.read(
        DriftSqlType.int,
        data['${effectivePrefix}total_bytes'],
      ),
      nonce: attachedDatabase.typeMapping.read(
        DriftSqlType.blob,
        data['${effectivePrefix}nonce'],
      ),
      lastError: attachedDatabase.typeMapping.read(
        DriftSqlType.string,
        data['${effectivePrefix}last_error'],
      ),
      updatedAt: attachedDatabase.typeMapping.read(
        DriftSqlType.dateTime,
        data['${effectivePrefix}updated_at'],
      )!,
    );
  }

  @override
  $DownloadedLessonsTable createAlias(String alias) {
    return $DownloadedLessonsTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<DownloadState, String, String> $converterstate =
      const EnumNameConverter<DownloadState>(DownloadState.values);
}

class DownloadedLesson extends DataClass
    implements Insertable<DownloadedLesson> {
  final String lessonId;
  final DownloadState state;

  /// Absolute path to the encrypted file on disk.
  final String filePath;

  /// Drives byte-range continuation on resume.
  final int bytesDownloaded;

  /// Expected total. E19-F01-S02 checks this against the file size before play
  /// (integrity check, task #126). Null until the first response's
  /// Content-Length is known.
  final int? totalBytes;

  /// Per-file AES-GCM IV. Unique per file; not secret.
  final Uint8List? nonce;

  /// Why the last attempt failed — supports "deleted local file falls back
  /// gracefully and re-marks the download as failed".
  final String? lastError;
  final DateTime updatedAt;
  const DownloadedLesson({
    required this.lessonId,
    required this.state,
    required this.filePath,
    required this.bytesDownloaded,
    this.totalBytes,
    this.nonce,
    this.lastError,
    required this.updatedAt,
  });
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['lesson_id'] = Variable<String>(lessonId);
    {
      map['state'] = Variable<String>(
        $DownloadedLessonsTable.$converterstate.toSql(state),
      );
    }
    map['file_path'] = Variable<String>(filePath);
    map['bytes_downloaded'] = Variable<int>(bytesDownloaded);
    if (!nullToAbsent || totalBytes != null) {
      map['total_bytes'] = Variable<int>(totalBytes);
    }
    if (!nullToAbsent || nonce != null) {
      map['nonce'] = Variable<Uint8List>(nonce);
    }
    if (!nullToAbsent || lastError != null) {
      map['last_error'] = Variable<String>(lastError);
    }
    map['updated_at'] = Variable<DateTime>(updatedAt);
    return map;
  }

  DownloadedLessonsCompanion toCompanion(bool nullToAbsent) {
    return DownloadedLessonsCompanion(
      lessonId: Value(lessonId),
      state: Value(state),
      filePath: Value(filePath),
      bytesDownloaded: Value(bytesDownloaded),
      totalBytes: totalBytes == null && nullToAbsent
          ? const Value.absent()
          : Value(totalBytes),
      nonce: nonce == null && nullToAbsent
          ? const Value.absent()
          : Value(nonce),
      lastError: lastError == null && nullToAbsent
          ? const Value.absent()
          : Value(lastError),
      updatedAt: Value(updatedAt),
    );
  }

  factory DownloadedLesson.fromJson(
    Map<String, dynamic> json, {
    ValueSerializer? serializer,
  }) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return DownloadedLesson(
      lessonId: serializer.fromJson<String>(json['lessonId']),
      state: $DownloadedLessonsTable.$converterstate.fromJson(
        serializer.fromJson<String>(json['state']),
      ),
      filePath: serializer.fromJson<String>(json['filePath']),
      bytesDownloaded: serializer.fromJson<int>(json['bytesDownloaded']),
      totalBytes: serializer.fromJson<int?>(json['totalBytes']),
      nonce: serializer.fromJson<Uint8List?>(json['nonce']),
      lastError: serializer.fromJson<String?>(json['lastError']),
      updatedAt: serializer.fromJson<DateTime>(json['updatedAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'lessonId': serializer.toJson<String>(lessonId),
      'state': serializer.toJson<String>(
        $DownloadedLessonsTable.$converterstate.toJson(state),
      ),
      'filePath': serializer.toJson<String>(filePath),
      'bytesDownloaded': serializer.toJson<int>(bytesDownloaded),
      'totalBytes': serializer.toJson<int?>(totalBytes),
      'nonce': serializer.toJson<Uint8List?>(nonce),
      'lastError': serializer.toJson<String?>(lastError),
      'updatedAt': serializer.toJson<DateTime>(updatedAt),
    };
  }

  DownloadedLesson copyWith({
    String? lessonId,
    DownloadState? state,
    String? filePath,
    int? bytesDownloaded,
    Value<int?> totalBytes = const Value.absent(),
    Value<Uint8List?> nonce = const Value.absent(),
    Value<String?> lastError = const Value.absent(),
    DateTime? updatedAt,
  }) => DownloadedLesson(
    lessonId: lessonId ?? this.lessonId,
    state: state ?? this.state,
    filePath: filePath ?? this.filePath,
    bytesDownloaded: bytesDownloaded ?? this.bytesDownloaded,
    totalBytes: totalBytes.present ? totalBytes.value : this.totalBytes,
    nonce: nonce.present ? nonce.value : this.nonce,
    lastError: lastError.present ? lastError.value : this.lastError,
    updatedAt: updatedAt ?? this.updatedAt,
  );
  DownloadedLesson copyWithCompanion(DownloadedLessonsCompanion data) {
    return DownloadedLesson(
      lessonId: data.lessonId.present ? data.lessonId.value : this.lessonId,
      state: data.state.present ? data.state.value : this.state,
      filePath: data.filePath.present ? data.filePath.value : this.filePath,
      bytesDownloaded: data.bytesDownloaded.present
          ? data.bytesDownloaded.value
          : this.bytesDownloaded,
      totalBytes: data.totalBytes.present
          ? data.totalBytes.value
          : this.totalBytes,
      nonce: data.nonce.present ? data.nonce.value : this.nonce,
      lastError: data.lastError.present ? data.lastError.value : this.lastError,
      updatedAt: data.updatedAt.present ? data.updatedAt.value : this.updatedAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('DownloadedLesson(')
          ..write('lessonId: $lessonId, ')
          ..write('state: $state, ')
          ..write('filePath: $filePath, ')
          ..write('bytesDownloaded: $bytesDownloaded, ')
          ..write('totalBytes: $totalBytes, ')
          ..write('nonce: $nonce, ')
          ..write('lastError: $lastError, ')
          ..write('updatedAt: $updatedAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(
    lessonId,
    state,
    filePath,
    bytesDownloaded,
    totalBytes,
    $driftBlobEquality.hash(nonce),
    lastError,
    updatedAt,
  );
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is DownloadedLesson &&
          other.lessonId == this.lessonId &&
          other.state == this.state &&
          other.filePath == this.filePath &&
          other.bytesDownloaded == this.bytesDownloaded &&
          other.totalBytes == this.totalBytes &&
          $driftBlobEquality.equals(other.nonce, this.nonce) &&
          other.lastError == this.lastError &&
          other.updatedAt == this.updatedAt);
}

class DownloadedLessonsCompanion extends UpdateCompanion<DownloadedLesson> {
  final Value<String> lessonId;
  final Value<DownloadState> state;
  final Value<String> filePath;
  final Value<int> bytesDownloaded;
  final Value<int?> totalBytes;
  final Value<Uint8List?> nonce;
  final Value<String?> lastError;
  final Value<DateTime> updatedAt;
  final Value<int> rowid;
  const DownloadedLessonsCompanion({
    this.lessonId = const Value.absent(),
    this.state = const Value.absent(),
    this.filePath = const Value.absent(),
    this.bytesDownloaded = const Value.absent(),
    this.totalBytes = const Value.absent(),
    this.nonce = const Value.absent(),
    this.lastError = const Value.absent(),
    this.updatedAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  DownloadedLessonsCompanion.insert({
    required String lessonId,
    required DownloadState state,
    required String filePath,
    this.bytesDownloaded = const Value.absent(),
    this.totalBytes = const Value.absent(),
    this.nonce = const Value.absent(),
    this.lastError = const Value.absent(),
    required DateTime updatedAt,
    this.rowid = const Value.absent(),
  }) : lessonId = Value(lessonId),
       state = Value(state),
       filePath = Value(filePath),
       updatedAt = Value(updatedAt);
  static Insertable<DownloadedLesson> custom({
    Expression<String>? lessonId,
    Expression<String>? state,
    Expression<String>? filePath,
    Expression<int>? bytesDownloaded,
    Expression<int>? totalBytes,
    Expression<Uint8List>? nonce,
    Expression<String>? lastError,
    Expression<DateTime>? updatedAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (lessonId != null) 'lesson_id': lessonId,
      if (state != null) 'state': state,
      if (filePath != null) 'file_path': filePath,
      if (bytesDownloaded != null) 'bytes_downloaded': bytesDownloaded,
      if (totalBytes != null) 'total_bytes': totalBytes,
      if (nonce != null) 'nonce': nonce,
      if (lastError != null) 'last_error': lastError,
      if (updatedAt != null) 'updated_at': updatedAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  DownloadedLessonsCompanion copyWith({
    Value<String>? lessonId,
    Value<DownloadState>? state,
    Value<String>? filePath,
    Value<int>? bytesDownloaded,
    Value<int?>? totalBytes,
    Value<Uint8List?>? nonce,
    Value<String?>? lastError,
    Value<DateTime>? updatedAt,
    Value<int>? rowid,
  }) {
    return DownloadedLessonsCompanion(
      lessonId: lessonId ?? this.lessonId,
      state: state ?? this.state,
      filePath: filePath ?? this.filePath,
      bytesDownloaded: bytesDownloaded ?? this.bytesDownloaded,
      totalBytes: totalBytes ?? this.totalBytes,
      nonce: nonce ?? this.nonce,
      lastError: lastError ?? this.lastError,
      updatedAt: updatedAt ?? this.updatedAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (lessonId.present) {
      map['lesson_id'] = Variable<String>(lessonId.value);
    }
    if (state.present) {
      map['state'] = Variable<String>(
        $DownloadedLessonsTable.$converterstate.toSql(state.value),
      );
    }
    if (filePath.present) {
      map['file_path'] = Variable<String>(filePath.value);
    }
    if (bytesDownloaded.present) {
      map['bytes_downloaded'] = Variable<int>(bytesDownloaded.value);
    }
    if (totalBytes.present) {
      map['total_bytes'] = Variable<int>(totalBytes.value);
    }
    if (nonce.present) {
      map['nonce'] = Variable<Uint8List>(nonce.value);
    }
    if (lastError.present) {
      map['last_error'] = Variable<String>(lastError.value);
    }
    if (updatedAt.present) {
      map['updated_at'] = Variable<DateTime>(updatedAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('DownloadedLessonsCompanion(')
          ..write('lessonId: $lessonId, ')
          ..write('state: $state, ')
          ..write('filePath: $filePath, ')
          ..write('bytesDownloaded: $bytesDownloaded, ')
          ..write('totalBytes: $totalBytes, ')
          ..write('nonce: $nonce, ')
          ..write('lastError: $lastError, ')
          ..write('updatedAt: $updatedAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $CachedCoursesTable cachedCourses = $CachedCoursesTable(this);
  late final $CachedSectionsTable cachedSections = $CachedSectionsTable(this);
  late final $CachedLessonsTable cachedLessons = $CachedLessonsTable(this);
  late final $ProgressOutboxTable progressOutbox = $ProgressOutboxTable(this);
  late final $NotesOutboxTable notesOutbox = $NotesOutboxTable(this);
  late final $BookmarksOutboxTable bookmarksOutbox = $BookmarksOutboxTable(
    this,
  );
  late final $DownloadedLessonsTable downloadedLessons =
      $DownloadedLessonsTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [
    cachedCourses,
    cachedSections,
    cachedLessons,
    progressOutbox,
    notesOutbox,
    bookmarksOutbox,
    downloadedLessons,
  ];
  @override
  StreamQueryUpdateRules get streamUpdateRules => const StreamQueryUpdateRules([
    WritePropagation(
      on: TableUpdateQuery.onTableName(
        'cached_courses',
        limitUpdateKind: UpdateKind.delete,
      ),
      result: [TableUpdate('cached_sections', kind: UpdateKind.delete)],
    ),
    WritePropagation(
      on: TableUpdateQuery.onTableName(
        'cached_sections',
        limitUpdateKind: UpdateKind.delete,
      ),
      result: [TableUpdate('cached_lessons', kind: UpdateKind.delete)],
    ),
    WritePropagation(
      on: TableUpdateQuery.onTableName(
        'cached_courses',
        limitUpdateKind: UpdateKind.delete,
      ),
      result: [TableUpdate('cached_lessons', kind: UpdateKind.delete)],
    ),
  ]);
}

typedef $$CachedCoursesTableCreateCompanionBuilder =
    CachedCoursesCompanion Function({
      required String id,
      required String libraryId,
      required String slug,
      required String title,
      required DateTime updatedAt,
      required DateTime cachedAt,
      required String payload,
      Value<int> rowid,
    });
typedef $$CachedCoursesTableUpdateCompanionBuilder =
    CachedCoursesCompanion Function({
      Value<String> id,
      Value<String> libraryId,
      Value<String> slug,
      Value<String> title,
      Value<DateTime> updatedAt,
      Value<DateTime> cachedAt,
      Value<String> payload,
      Value<int> rowid,
    });

final class $$CachedCoursesTableReferences
    extends BaseReferences<_$AppDatabase, $CachedCoursesTable, CachedCourse> {
  $$CachedCoursesTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static MultiTypedResultKey<$CachedSectionsTable, List<CachedSection>>
  _cachedSectionsRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.cachedSections,
    aliasName: 'cached_courses__id__cached_sections__course_id',
  );

  $$CachedSectionsTableProcessedTableManager get cachedSectionsRefs {
    final manager = $$CachedSectionsTableTableManager(
      $_db,
      $_db.cachedSections,
    ).filter((f) => f.courseId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_cachedSectionsRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }

  static MultiTypedResultKey<$CachedLessonsTable, List<CachedLesson>>
  _cachedLessonsRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.cachedLessons,
    aliasName: 'cached_courses__id__cached_lessons__course_id',
  );

  $$CachedLessonsTableProcessedTableManager get cachedLessonsRefs {
    final manager = $$CachedLessonsTableTableManager(
      $_db,
      $_db.cachedLessons,
    ).filter((f) => f.courseId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_cachedLessonsRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$CachedCoursesTableFilterComposer
    extends Composer<_$AppDatabase, $CachedCoursesTable> {
  $$CachedCoursesTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get libraryId => $composableBuilder(
    column: $table.libraryId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get slug => $composableBuilder(
    column: $table.slug,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  Expression<bool> cachedSectionsRefs(
    Expression<bool> Function($$CachedSectionsTableFilterComposer f) f,
  ) {
    final $$CachedSectionsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.cachedSections,
      getReferencedColumn: (t) => t.courseId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedSectionsTableFilterComposer(
            $db: $db,
            $table: $db.cachedSections,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<bool> cachedLessonsRefs(
    Expression<bool> Function($$CachedLessonsTableFilterComposer f) f,
  ) {
    final $$CachedLessonsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.cachedLessons,
      getReferencedColumn: (t) => t.courseId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedLessonsTableFilterComposer(
            $db: $db,
            $table: $db.cachedLessons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$CachedCoursesTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedCoursesTable> {
  $$CachedCoursesTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get libraryId => $composableBuilder(
    column: $table.libraryId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get slug => $composableBuilder(
    column: $table.slug,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get title => $composableBuilder(
    column: $table.title,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$CachedCoursesTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedCoursesTable> {
  $$CachedCoursesTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get libraryId =>
      $composableBuilder(column: $table.libraryId, builder: (column) => column);

  GeneratedColumn<String> get slug =>
      $composableBuilder(column: $table.slug, builder: (column) => column);

  GeneratedColumn<String> get title =>
      $composableBuilder(column: $table.title, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  Expression<T> cachedSectionsRefs<T extends Object>(
    Expression<T> Function($$CachedSectionsTableAnnotationComposer a) f,
  ) {
    final $$CachedSectionsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.cachedSections,
      getReferencedColumn: (t) => t.courseId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedSectionsTableAnnotationComposer(
            $db: $db,
            $table: $db.cachedSections,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }

  Expression<T> cachedLessonsRefs<T extends Object>(
    Expression<T> Function($$CachedLessonsTableAnnotationComposer a) f,
  ) {
    final $$CachedLessonsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.cachedLessons,
      getReferencedColumn: (t) => t.courseId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedLessonsTableAnnotationComposer(
            $db: $db,
            $table: $db.cachedLessons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$CachedCoursesTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedCoursesTable,
          CachedCourse,
          $$CachedCoursesTableFilterComposer,
          $$CachedCoursesTableOrderingComposer,
          $$CachedCoursesTableAnnotationComposer,
          $$CachedCoursesTableCreateCompanionBuilder,
          $$CachedCoursesTableUpdateCompanionBuilder,
          (CachedCourse, $$CachedCoursesTableReferences),
          CachedCourse,
          PrefetchHooks Function({
            bool cachedSectionsRefs,
            bool cachedLessonsRefs,
          })
        > {
  $$CachedCoursesTableTableManager(_$AppDatabase db, $CachedCoursesTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedCoursesTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedCoursesTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedCoursesTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> libraryId = const Value.absent(),
                Value<String> slug = const Value.absent(),
                Value<String> title = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedCoursesCompanion(
                id: id,
                libraryId: libraryId,
                slug: slug,
                title: title,
                updatedAt: updatedAt,
                cachedAt: cachedAt,
                payload: payload,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String libraryId,
                required String slug,
                required String title,
                required DateTime updatedAt,
                required DateTime cachedAt,
                required String payload,
                Value<int> rowid = const Value.absent(),
              }) => CachedCoursesCompanion.insert(
                id: id,
                libraryId: libraryId,
                slug: slug,
                title: title,
                updatedAt: updatedAt,
                cachedAt: cachedAt,
                payload: payload,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$CachedCoursesTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback:
              ({cachedSectionsRefs = false, cachedLessonsRefs = false}) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [
                    if (cachedSectionsRefs) db.cachedSections,
                    if (cachedLessonsRefs) db.cachedLessons,
                  ],
                  addJoins: null,
                  getPrefetchedDataCallback: (items) async {
                    return [
                      if (cachedSectionsRefs)
                        await $_getPrefetchedData<
                          CachedCourse,
                          $CachedCoursesTable,
                          CachedSection
                        >(
                          currentTable: table,
                          referencedTable: $$CachedCoursesTableReferences
                              ._cachedSectionsRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$CachedCoursesTableReferences(
                                db,
                                table,
                                p0,
                              ).cachedSectionsRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.courseId == item.id,
                              ),
                          typedResults: items,
                        ),
                      if (cachedLessonsRefs)
                        await $_getPrefetchedData<
                          CachedCourse,
                          $CachedCoursesTable,
                          CachedLesson
                        >(
                          currentTable: table,
                          referencedTable: $$CachedCoursesTableReferences
                              ._cachedLessonsRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$CachedCoursesTableReferences(
                                db,
                                table,
                                p0,
                              ).cachedLessonsRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.courseId == item.id,
                              ),
                          typedResults: items,
                        ),
                    ];
                  },
                );
              },
        ),
      );
}

typedef $$CachedCoursesTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedCoursesTable,
      CachedCourse,
      $$CachedCoursesTableFilterComposer,
      $$CachedCoursesTableOrderingComposer,
      $$CachedCoursesTableAnnotationComposer,
      $$CachedCoursesTableCreateCompanionBuilder,
      $$CachedCoursesTableUpdateCompanionBuilder,
      (CachedCourse, $$CachedCoursesTableReferences),
      CachedCourse,
      PrefetchHooks Function({bool cachedSectionsRefs, bool cachedLessonsRefs})
    >;
typedef $$CachedSectionsTableCreateCompanionBuilder =
    CachedSectionsCompanion Function({
      required String id,
      required String courseId,
      required int position,
      required DateTime cachedAt,
      required String payload,
      Value<int> rowid,
    });
typedef $$CachedSectionsTableUpdateCompanionBuilder =
    CachedSectionsCompanion Function({
      Value<String> id,
      Value<String> courseId,
      Value<int> position,
      Value<DateTime> cachedAt,
      Value<String> payload,
      Value<int> rowid,
    });

final class $$CachedSectionsTableReferences
    extends BaseReferences<_$AppDatabase, $CachedSectionsTable, CachedSection> {
  $$CachedSectionsTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $CachedCoursesTable _courseIdTable(_$AppDatabase db) => db
      .cachedCourses
      .createAlias('cached_sections__course_id__cached_courses__id');

  $$CachedCoursesTableProcessedTableManager get courseId {
    final $_column = $_itemColumn<String>('course_id')!;

    final manager = $$CachedCoursesTableTableManager(
      $_db,
      $_db.cachedCourses,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_courseIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }

  static MultiTypedResultKey<$CachedLessonsTable, List<CachedLesson>>
  _cachedLessonsRefsTable(_$AppDatabase db) => MultiTypedResultKey.fromTable(
    db.cachedLessons,
    aliasName: 'cached_sections__id__cached_lessons__section_id',
  );

  $$CachedLessonsTableProcessedTableManager get cachedLessonsRefs {
    final manager = $$CachedLessonsTableTableManager(
      $_db,
      $_db.cachedLessons,
    ).filter((f) => f.sectionId.id.sqlEquals($_itemColumn<String>('id')!));

    final cache = $_typedResult.readTableOrNull(_cachedLessonsRefsTable($_db));
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: cache),
    );
  }
}

class $$CachedSectionsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedSectionsTable> {
  $$CachedSectionsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get position => $composableBuilder(
    column: $table.position,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  $$CachedCoursesTableFilterComposer get courseId {
    final $$CachedCoursesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.courseId,
      referencedTable: $db.cachedCourses,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedCoursesTableFilterComposer(
            $db: $db,
            $table: $db.cachedCourses,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  Expression<bool> cachedLessonsRefs(
    Expression<bool> Function($$CachedLessonsTableFilterComposer f) f,
  ) {
    final $$CachedLessonsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.cachedLessons,
      getReferencedColumn: (t) => t.sectionId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedLessonsTableFilterComposer(
            $db: $db,
            $table: $db.cachedLessons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$CachedSectionsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedSectionsTable> {
  $$CachedSectionsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get position => $composableBuilder(
    column: $table.position,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  $$CachedCoursesTableOrderingComposer get courseId {
    final $$CachedCoursesTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.courseId,
      referencedTable: $db.cachedCourses,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedCoursesTableOrderingComposer(
            $db: $db,
            $table: $db.cachedCourses,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$CachedSectionsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedSectionsTable> {
  $$CachedSectionsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get position =>
      $composableBuilder(column: $table.position, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  $$CachedCoursesTableAnnotationComposer get courseId {
    final $$CachedCoursesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.courseId,
      referencedTable: $db.cachedCourses,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedCoursesTableAnnotationComposer(
            $db: $db,
            $table: $db.cachedCourses,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  Expression<T> cachedLessonsRefs<T extends Object>(
    Expression<T> Function($$CachedLessonsTableAnnotationComposer a) f,
  ) {
    final $$CachedLessonsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.id,
      referencedTable: $db.cachedLessons,
      getReferencedColumn: (t) => t.sectionId,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedLessonsTableAnnotationComposer(
            $db: $db,
            $table: $db.cachedLessons,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return f(composer);
  }
}

class $$CachedSectionsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedSectionsTable,
          CachedSection,
          $$CachedSectionsTableFilterComposer,
          $$CachedSectionsTableOrderingComposer,
          $$CachedSectionsTableAnnotationComposer,
          $$CachedSectionsTableCreateCompanionBuilder,
          $$CachedSectionsTableUpdateCompanionBuilder,
          (CachedSection, $$CachedSectionsTableReferences),
          CachedSection,
          PrefetchHooks Function({bool courseId, bool cachedLessonsRefs})
        > {
  $$CachedSectionsTableTableManager(
    _$AppDatabase db,
    $CachedSectionsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedSectionsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedSectionsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedSectionsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> courseId = const Value.absent(),
                Value<int> position = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedSectionsCompanion(
                id: id,
                courseId: courseId,
                position: position,
                cachedAt: cachedAt,
                payload: payload,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String courseId,
                required int position,
                required DateTime cachedAt,
                required String payload,
                Value<int> rowid = const Value.absent(),
              }) => CachedSectionsCompanion.insert(
                id: id,
                courseId: courseId,
                position: position,
                cachedAt: cachedAt,
                payload: payload,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$CachedSectionsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback:
              ({courseId = false, cachedLessonsRefs = false}) {
                return PrefetchHooks(
                  db: db,
                  explicitlyWatchedTables: [
                    if (cachedLessonsRefs) db.cachedLessons,
                  ],
                  addJoins:
                      <
                        T extends TableManagerState<
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic,
                          dynamic
                        >
                      >(state) {
                        if (courseId) {
                          state =
                              state.withJoin(
                                    currentTable: table,
                                    currentColumn: table.courseId,
                                    referencedTable:
                                        $$CachedSectionsTableReferences
                                            ._courseIdTable(db),
                                    referencedColumn:
                                        $$CachedSectionsTableReferences
                                            ._courseIdTable(db)
                                            .id,
                                  )
                                  as T;
                        }

                        return state;
                      },
                  getPrefetchedDataCallback: (items) async {
                    return [
                      if (cachedLessonsRefs)
                        await $_getPrefetchedData<
                          CachedSection,
                          $CachedSectionsTable,
                          CachedLesson
                        >(
                          currentTable: table,
                          referencedTable: $$CachedSectionsTableReferences
                              ._cachedLessonsRefsTable(db),
                          managerFromTypedResult: (p0) =>
                              $$CachedSectionsTableReferences(
                                db,
                                table,
                                p0,
                              ).cachedLessonsRefs,
                          referencedItemsForCurrentItem:
                              (item, referencedItems) => referencedItems.where(
                                (e) => e.sectionId == item.id,
                              ),
                          typedResults: items,
                        ),
                    ];
                  },
                );
              },
        ),
      );
}

typedef $$CachedSectionsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedSectionsTable,
      CachedSection,
      $$CachedSectionsTableFilterComposer,
      $$CachedSectionsTableOrderingComposer,
      $$CachedSectionsTableAnnotationComposer,
      $$CachedSectionsTableCreateCompanionBuilder,
      $$CachedSectionsTableUpdateCompanionBuilder,
      (CachedSection, $$CachedSectionsTableReferences),
      CachedSection,
      PrefetchHooks Function({bool courseId, bool cachedLessonsRefs})
    >;
typedef $$CachedLessonsTableCreateCompanionBuilder =
    CachedLessonsCompanion Function({
      required String id,
      required String sectionId,
      required String courseId,
      required int position,
      required DateTime cachedAt,
      required String payload,
      Value<int> rowid,
    });
typedef $$CachedLessonsTableUpdateCompanionBuilder =
    CachedLessonsCompanion Function({
      Value<String> id,
      Value<String> sectionId,
      Value<String> courseId,
      Value<int> position,
      Value<DateTime> cachedAt,
      Value<String> payload,
      Value<int> rowid,
    });

final class $$CachedLessonsTableReferences
    extends BaseReferences<_$AppDatabase, $CachedLessonsTable, CachedLesson> {
  $$CachedLessonsTableReferences(
    super.$_db,
    super.$_table,
    super.$_typedResult,
  );

  static $CachedSectionsTable _sectionIdTable(_$AppDatabase db) => db
      .cachedSections
      .createAlias('cached_lessons__section_id__cached_sections__id');

  $$CachedSectionsTableProcessedTableManager get sectionId {
    final $_column = $_itemColumn<String>('section_id')!;

    final manager = $$CachedSectionsTableTableManager(
      $_db,
      $_db.cachedSections,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_sectionIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }

  static $CachedCoursesTable _courseIdTable(_$AppDatabase db) => db
      .cachedCourses
      .createAlias('cached_lessons__course_id__cached_courses__id');

  $$CachedCoursesTableProcessedTableManager get courseId {
    final $_column = $_itemColumn<String>('course_id')!;

    final manager = $$CachedCoursesTableTableManager(
      $_db,
      $_db.cachedCourses,
    ).filter((f) => f.id.sqlEquals($_column));
    final item = $_typedResult.readTableOrNull(_courseIdTable($_db));
    if (item == null) return manager;
    return ProcessedTableManager(
      manager.$state.copyWith(prefetchedData: [item]),
    );
  }
}

class $$CachedLessonsTableFilterComposer
    extends Composer<_$AppDatabase, $CachedLessonsTable> {
  $$CachedLessonsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get position => $composableBuilder(
    column: $table.position,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnFilters(column),
  );

  $$CachedSectionsTableFilterComposer get sectionId {
    final $$CachedSectionsTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sectionId,
      referencedTable: $db.cachedSections,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedSectionsTableFilterComposer(
            $db: $db,
            $table: $db.cachedSections,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$CachedCoursesTableFilterComposer get courseId {
    final $$CachedCoursesTableFilterComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.courseId,
      referencedTable: $db.cachedCourses,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedCoursesTableFilterComposer(
            $db: $db,
            $table: $db.cachedCourses,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$CachedLessonsTableOrderingComposer
    extends Composer<_$AppDatabase, $CachedLessonsTable> {
  $$CachedLessonsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
    column: $table.id,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get position => $composableBuilder(
    column: $table.position,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get cachedAt => $composableBuilder(
    column: $table.cachedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get payload => $composableBuilder(
    column: $table.payload,
    builder: (column) => ColumnOrderings(column),
  );

  $$CachedSectionsTableOrderingComposer get sectionId {
    final $$CachedSectionsTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sectionId,
      referencedTable: $db.cachedSections,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedSectionsTableOrderingComposer(
            $db: $db,
            $table: $db.cachedSections,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$CachedCoursesTableOrderingComposer get courseId {
    final $$CachedCoursesTableOrderingComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.courseId,
      referencedTable: $db.cachedCourses,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedCoursesTableOrderingComposer(
            $db: $db,
            $table: $db.cachedCourses,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$CachedLessonsTableAnnotationComposer
    extends Composer<_$AppDatabase, $CachedLessonsTable> {
  $$CachedLessonsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<int> get position =>
      $composableBuilder(column: $table.position, builder: (column) => column);

  GeneratedColumn<DateTime> get cachedAt =>
      $composableBuilder(column: $table.cachedAt, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  $$CachedSectionsTableAnnotationComposer get sectionId {
    final $$CachedSectionsTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.sectionId,
      referencedTable: $db.cachedSections,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedSectionsTableAnnotationComposer(
            $db: $db,
            $table: $db.cachedSections,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }

  $$CachedCoursesTableAnnotationComposer get courseId {
    final $$CachedCoursesTableAnnotationComposer composer = $composerBuilder(
      composer: this,
      getCurrentColumn: (t) => t.courseId,
      referencedTable: $db.cachedCourses,
      getReferencedColumn: (t) => t.id,
      builder:
          (
            joinBuilder, {
            $addJoinBuilderToRootComposer,
            $removeJoinBuilderFromRootComposer,
          }) => $$CachedCoursesTableAnnotationComposer(
            $db: $db,
            $table: $db.cachedCourses,
            $addJoinBuilderToRootComposer: $addJoinBuilderToRootComposer,
            joinBuilder: joinBuilder,
            $removeJoinBuilderFromRootComposer:
                $removeJoinBuilderFromRootComposer,
          ),
    );
    return composer;
  }
}

class $$CachedLessonsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $CachedLessonsTable,
          CachedLesson,
          $$CachedLessonsTableFilterComposer,
          $$CachedLessonsTableOrderingComposer,
          $$CachedLessonsTableAnnotationComposer,
          $$CachedLessonsTableCreateCompanionBuilder,
          $$CachedLessonsTableUpdateCompanionBuilder,
          (CachedLesson, $$CachedLessonsTableReferences),
          CachedLesson,
          PrefetchHooks Function({bool sectionId, bool courseId})
        > {
  $$CachedLessonsTableTableManager(_$AppDatabase db, $CachedLessonsTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$CachedLessonsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$CachedLessonsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$CachedLessonsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> id = const Value.absent(),
                Value<String> sectionId = const Value.absent(),
                Value<String> courseId = const Value.absent(),
                Value<int> position = const Value.absent(),
                Value<DateTime> cachedAt = const Value.absent(),
                Value<String> payload = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => CachedLessonsCompanion(
                id: id,
                sectionId: sectionId,
                courseId: courseId,
                position: position,
                cachedAt: cachedAt,
                payload: payload,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String id,
                required String sectionId,
                required String courseId,
                required int position,
                required DateTime cachedAt,
                required String payload,
                Value<int> rowid = const Value.absent(),
              }) => CachedLessonsCompanion.insert(
                id: id,
                sectionId: sectionId,
                courseId: courseId,
                position: position,
                cachedAt: cachedAt,
                payload: payload,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map(
                (e) => (
                  e.readTable(table),
                  $$CachedLessonsTableReferences(db, table, e),
                ),
              )
              .toList(),
          prefetchHooksCallback: ({sectionId = false, courseId = false}) {
            return PrefetchHooks(
              db: db,
              explicitlyWatchedTables: [],
              addJoins:
                  <
                    T extends TableManagerState<
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic,
                      dynamic
                    >
                  >(state) {
                    if (sectionId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.sectionId,
                                referencedTable: $$CachedLessonsTableReferences
                                    ._sectionIdTable(db),
                                referencedColumn: $$CachedLessonsTableReferences
                                    ._sectionIdTable(db)
                                    .id,
                              )
                              as T;
                    }
                    if (courseId) {
                      state =
                          state.withJoin(
                                currentTable: table,
                                currentColumn: table.courseId,
                                referencedTable: $$CachedLessonsTableReferences
                                    ._courseIdTable(db),
                                referencedColumn: $$CachedLessonsTableReferences
                                    ._courseIdTable(db)
                                    .id,
                              )
                              as T;
                    }

                    return state;
                  },
              getPrefetchedDataCallback: (items) async {
                return [];
              },
            );
          },
        ),
      );
}

typedef $$CachedLessonsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $CachedLessonsTable,
      CachedLesson,
      $$CachedLessonsTableFilterComposer,
      $$CachedLessonsTableOrderingComposer,
      $$CachedLessonsTableAnnotationComposer,
      $$CachedLessonsTableCreateCompanionBuilder,
      $$CachedLessonsTableUpdateCompanionBuilder,
      (CachedLesson, $$CachedLessonsTableReferences),
      CachedLesson,
      PrefetchHooks Function({bool sectionId, bool courseId})
    >;
typedef $$ProgressOutboxTableCreateCompanionBuilder =
    ProgressOutboxCompanion Function({
      required String lessonId,
      required int positionSeconds,
      required int durationSeconds,
      required DateTime clientUpdatedAt,
      required DateTime queuedAt,
      Value<int> rowid,
    });
typedef $$ProgressOutboxTableUpdateCompanionBuilder =
    ProgressOutboxCompanion Function({
      Value<String> lessonId,
      Value<int> positionSeconds,
      Value<int> durationSeconds,
      Value<DateTime> clientUpdatedAt,
      Value<DateTime> queuedAt,
      Value<int> rowid,
    });

class $$ProgressOutboxTableFilterComposer
    extends Composer<_$AppDatabase, $ProgressOutboxTable> {
  $$ProgressOutboxTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get positionSeconds => $composableBuilder(
    column: $table.positionSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get durationSeconds => $composableBuilder(
    column: $table.durationSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get clientUpdatedAt => $composableBuilder(
    column: $table.clientUpdatedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get queuedAt => $composableBuilder(
    column: $table.queuedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$ProgressOutboxTableOrderingComposer
    extends Composer<_$AppDatabase, $ProgressOutboxTable> {
  $$ProgressOutboxTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get positionSeconds => $composableBuilder(
    column: $table.positionSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get durationSeconds => $composableBuilder(
    column: $table.durationSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get clientUpdatedAt => $composableBuilder(
    column: $table.clientUpdatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get queuedAt => $composableBuilder(
    column: $table.queuedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$ProgressOutboxTableAnnotationComposer
    extends Composer<_$AppDatabase, $ProgressOutboxTable> {
  $$ProgressOutboxTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get lessonId =>
      $composableBuilder(column: $table.lessonId, builder: (column) => column);

  GeneratedColumn<int> get positionSeconds => $composableBuilder(
    column: $table.positionSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<int> get durationSeconds => $composableBuilder(
    column: $table.durationSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get clientUpdatedAt => $composableBuilder(
    column: $table.clientUpdatedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get queuedAt =>
      $composableBuilder(column: $table.queuedAt, builder: (column) => column);
}

class $$ProgressOutboxTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $ProgressOutboxTable,
          ProgressOutboxEntry,
          $$ProgressOutboxTableFilterComposer,
          $$ProgressOutboxTableOrderingComposer,
          $$ProgressOutboxTableAnnotationComposer,
          $$ProgressOutboxTableCreateCompanionBuilder,
          $$ProgressOutboxTableUpdateCompanionBuilder,
          (
            ProgressOutboxEntry,
            BaseReferences<
              _$AppDatabase,
              $ProgressOutboxTable,
              ProgressOutboxEntry
            >,
          ),
          ProgressOutboxEntry,
          PrefetchHooks Function()
        > {
  $$ProgressOutboxTableTableManager(
    _$AppDatabase db,
    $ProgressOutboxTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$ProgressOutboxTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$ProgressOutboxTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$ProgressOutboxTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> lessonId = const Value.absent(),
                Value<int> positionSeconds = const Value.absent(),
                Value<int> durationSeconds = const Value.absent(),
                Value<DateTime> clientUpdatedAt = const Value.absent(),
                Value<DateTime> queuedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => ProgressOutboxCompanion(
                lessonId: lessonId,
                positionSeconds: positionSeconds,
                durationSeconds: durationSeconds,
                clientUpdatedAt: clientUpdatedAt,
                queuedAt: queuedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String lessonId,
                required int positionSeconds,
                required int durationSeconds,
                required DateTime clientUpdatedAt,
                required DateTime queuedAt,
                Value<int> rowid = const Value.absent(),
              }) => ProgressOutboxCompanion.insert(
                lessonId: lessonId,
                positionSeconds: positionSeconds,
                durationSeconds: durationSeconds,
                clientUpdatedAt: clientUpdatedAt,
                queuedAt: queuedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$ProgressOutboxTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $ProgressOutboxTable,
      ProgressOutboxEntry,
      $$ProgressOutboxTableFilterComposer,
      $$ProgressOutboxTableOrderingComposer,
      $$ProgressOutboxTableAnnotationComposer,
      $$ProgressOutboxTableCreateCompanionBuilder,
      $$ProgressOutboxTableUpdateCompanionBuilder,
      (
        ProgressOutboxEntry,
        BaseReferences<
          _$AppDatabase,
          $ProgressOutboxTable,
          ProgressOutboxEntry
        >,
      ),
      ProgressOutboxEntry,
      PrefetchHooks Function()
    >;
typedef $$NotesOutboxTableCreateCompanionBuilder =
    NotesOutboxCompanion Function({
      required String lessonId,
      required OutboxOp op,
      Value<String?> body,
      required DateTime clientUpdatedAt,
      required DateTime queuedAt,
      Value<int> rowid,
    });
typedef $$NotesOutboxTableUpdateCompanionBuilder =
    NotesOutboxCompanion Function({
      Value<String> lessonId,
      Value<OutboxOp> op,
      Value<String?> body,
      Value<DateTime> clientUpdatedAt,
      Value<DateTime> queuedAt,
      Value<int> rowid,
    });

class $$NotesOutboxTableFilterComposer
    extends Composer<_$AppDatabase, $NotesOutboxTable> {
  $$NotesOutboxTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<OutboxOp, OutboxOp, String> get op =>
      $composableBuilder(
        column: $table.op,
        builder: (column) => ColumnWithTypeConverterFilters(column),
      );

  ColumnFilters<String> get body => $composableBuilder(
    column: $table.body,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get clientUpdatedAt => $composableBuilder(
    column: $table.clientUpdatedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get queuedAt => $composableBuilder(
    column: $table.queuedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$NotesOutboxTableOrderingComposer
    extends Composer<_$AppDatabase, $NotesOutboxTable> {
  $$NotesOutboxTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get op => $composableBuilder(
    column: $table.op,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get body => $composableBuilder(
    column: $table.body,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get clientUpdatedAt => $composableBuilder(
    column: $table.clientUpdatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get queuedAt => $composableBuilder(
    column: $table.queuedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$NotesOutboxTableAnnotationComposer
    extends Composer<_$AppDatabase, $NotesOutboxTable> {
  $$NotesOutboxTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get lessonId =>
      $composableBuilder(column: $table.lessonId, builder: (column) => column);

  GeneratedColumnWithTypeConverter<OutboxOp, String> get op =>
      $composableBuilder(column: $table.op, builder: (column) => column);

  GeneratedColumn<String> get body =>
      $composableBuilder(column: $table.body, builder: (column) => column);

  GeneratedColumn<DateTime> get clientUpdatedAt => $composableBuilder(
    column: $table.clientUpdatedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get queuedAt =>
      $composableBuilder(column: $table.queuedAt, builder: (column) => column);
}

class $$NotesOutboxTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $NotesOutboxTable,
          NotesOutboxEntry,
          $$NotesOutboxTableFilterComposer,
          $$NotesOutboxTableOrderingComposer,
          $$NotesOutboxTableAnnotationComposer,
          $$NotesOutboxTableCreateCompanionBuilder,
          $$NotesOutboxTableUpdateCompanionBuilder,
          (
            NotesOutboxEntry,
            BaseReferences<_$AppDatabase, $NotesOutboxTable, NotesOutboxEntry>,
          ),
          NotesOutboxEntry,
          PrefetchHooks Function()
        > {
  $$NotesOutboxTableTableManager(_$AppDatabase db, $NotesOutboxTable table)
    : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$NotesOutboxTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$NotesOutboxTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$NotesOutboxTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> lessonId = const Value.absent(),
                Value<OutboxOp> op = const Value.absent(),
                Value<String?> body = const Value.absent(),
                Value<DateTime> clientUpdatedAt = const Value.absent(),
                Value<DateTime> queuedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => NotesOutboxCompanion(
                lessonId: lessonId,
                op: op,
                body: body,
                clientUpdatedAt: clientUpdatedAt,
                queuedAt: queuedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String lessonId,
                required OutboxOp op,
                Value<String?> body = const Value.absent(),
                required DateTime clientUpdatedAt,
                required DateTime queuedAt,
                Value<int> rowid = const Value.absent(),
              }) => NotesOutboxCompanion.insert(
                lessonId: lessonId,
                op: op,
                body: body,
                clientUpdatedAt: clientUpdatedAt,
                queuedAt: queuedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$NotesOutboxTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $NotesOutboxTable,
      NotesOutboxEntry,
      $$NotesOutboxTableFilterComposer,
      $$NotesOutboxTableOrderingComposer,
      $$NotesOutboxTableAnnotationComposer,
      $$NotesOutboxTableCreateCompanionBuilder,
      $$NotesOutboxTableUpdateCompanionBuilder,
      (
        NotesOutboxEntry,
        BaseReferences<_$AppDatabase, $NotesOutboxTable, NotesOutboxEntry>,
      ),
      NotesOutboxEntry,
      PrefetchHooks Function()
    >;
typedef $$BookmarksOutboxTableCreateCompanionBuilder =
    BookmarksOutboxCompanion Function({
      required String localId,
      Value<String?> serverId,
      required String lessonId,
      required OutboxOp op,
      Value<int?> positionSeconds,
      Value<String?> label,
      required DateTime clientUpdatedAt,
      required DateTime queuedAt,
      Value<int> rowid,
    });
typedef $$BookmarksOutboxTableUpdateCompanionBuilder =
    BookmarksOutboxCompanion Function({
      Value<String> localId,
      Value<String?> serverId,
      Value<String> lessonId,
      Value<OutboxOp> op,
      Value<int?> positionSeconds,
      Value<String?> label,
      Value<DateTime> clientUpdatedAt,
      Value<DateTime> queuedAt,
      Value<int> rowid,
    });

class $$BookmarksOutboxTableFilterComposer
    extends Composer<_$AppDatabase, $BookmarksOutboxTable> {
  $$BookmarksOutboxTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get localId => $composableBuilder(
    column: $table.localId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get serverId => $composableBuilder(
    column: $table.serverId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<OutboxOp, OutboxOp, String> get op =>
      $composableBuilder(
        column: $table.op,
        builder: (column) => ColumnWithTypeConverterFilters(column),
      );

  ColumnFilters<int> get positionSeconds => $composableBuilder(
    column: $table.positionSeconds,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get label => $composableBuilder(
    column: $table.label,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get clientUpdatedAt => $composableBuilder(
    column: $table.clientUpdatedAt,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get queuedAt => $composableBuilder(
    column: $table.queuedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$BookmarksOutboxTableOrderingComposer
    extends Composer<_$AppDatabase, $BookmarksOutboxTable> {
  $$BookmarksOutboxTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get localId => $composableBuilder(
    column: $table.localId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get serverId => $composableBuilder(
    column: $table.serverId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get op => $composableBuilder(
    column: $table.op,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get positionSeconds => $composableBuilder(
    column: $table.positionSeconds,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get label => $composableBuilder(
    column: $table.label,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get clientUpdatedAt => $composableBuilder(
    column: $table.clientUpdatedAt,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get queuedAt => $composableBuilder(
    column: $table.queuedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$BookmarksOutboxTableAnnotationComposer
    extends Composer<_$AppDatabase, $BookmarksOutboxTable> {
  $$BookmarksOutboxTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get localId =>
      $composableBuilder(column: $table.localId, builder: (column) => column);

  GeneratedColumn<String> get serverId =>
      $composableBuilder(column: $table.serverId, builder: (column) => column);

  GeneratedColumn<String> get lessonId =>
      $composableBuilder(column: $table.lessonId, builder: (column) => column);

  GeneratedColumnWithTypeConverter<OutboxOp, String> get op =>
      $composableBuilder(column: $table.op, builder: (column) => column);

  GeneratedColumn<int> get positionSeconds => $composableBuilder(
    column: $table.positionSeconds,
    builder: (column) => column,
  );

  GeneratedColumn<String> get label =>
      $composableBuilder(column: $table.label, builder: (column) => column);

  GeneratedColumn<DateTime> get clientUpdatedAt => $composableBuilder(
    column: $table.clientUpdatedAt,
    builder: (column) => column,
  );

  GeneratedColumn<DateTime> get queuedAt =>
      $composableBuilder(column: $table.queuedAt, builder: (column) => column);
}

class $$BookmarksOutboxTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $BookmarksOutboxTable,
          BookmarksOutboxEntry,
          $$BookmarksOutboxTableFilterComposer,
          $$BookmarksOutboxTableOrderingComposer,
          $$BookmarksOutboxTableAnnotationComposer,
          $$BookmarksOutboxTableCreateCompanionBuilder,
          $$BookmarksOutboxTableUpdateCompanionBuilder,
          (
            BookmarksOutboxEntry,
            BaseReferences<
              _$AppDatabase,
              $BookmarksOutboxTable,
              BookmarksOutboxEntry
            >,
          ),
          BookmarksOutboxEntry,
          PrefetchHooks Function()
        > {
  $$BookmarksOutboxTableTableManager(
    _$AppDatabase db,
    $BookmarksOutboxTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$BookmarksOutboxTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$BookmarksOutboxTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$BookmarksOutboxTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback:
              ({
                Value<String> localId = const Value.absent(),
                Value<String?> serverId = const Value.absent(),
                Value<String> lessonId = const Value.absent(),
                Value<OutboxOp> op = const Value.absent(),
                Value<int?> positionSeconds = const Value.absent(),
                Value<String?> label = const Value.absent(),
                Value<DateTime> clientUpdatedAt = const Value.absent(),
                Value<DateTime> queuedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => BookmarksOutboxCompanion(
                localId: localId,
                serverId: serverId,
                lessonId: lessonId,
                op: op,
                positionSeconds: positionSeconds,
                label: label,
                clientUpdatedAt: clientUpdatedAt,
                queuedAt: queuedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String localId,
                Value<String?> serverId = const Value.absent(),
                required String lessonId,
                required OutboxOp op,
                Value<int?> positionSeconds = const Value.absent(),
                Value<String?> label = const Value.absent(),
                required DateTime clientUpdatedAt,
                required DateTime queuedAt,
                Value<int> rowid = const Value.absent(),
              }) => BookmarksOutboxCompanion.insert(
                localId: localId,
                serverId: serverId,
                lessonId: lessonId,
                op: op,
                positionSeconds: positionSeconds,
                label: label,
                clientUpdatedAt: clientUpdatedAt,
                queuedAt: queuedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$BookmarksOutboxTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $BookmarksOutboxTable,
      BookmarksOutboxEntry,
      $$BookmarksOutboxTableFilterComposer,
      $$BookmarksOutboxTableOrderingComposer,
      $$BookmarksOutboxTableAnnotationComposer,
      $$BookmarksOutboxTableCreateCompanionBuilder,
      $$BookmarksOutboxTableUpdateCompanionBuilder,
      (
        BookmarksOutboxEntry,
        BaseReferences<
          _$AppDatabase,
          $BookmarksOutboxTable,
          BookmarksOutboxEntry
        >,
      ),
      BookmarksOutboxEntry,
      PrefetchHooks Function()
    >;
typedef $$DownloadedLessonsTableCreateCompanionBuilder =
    DownloadedLessonsCompanion Function({
      required String lessonId,
      required DownloadState state,
      required String filePath,
      Value<int> bytesDownloaded,
      Value<int?> totalBytes,
      Value<Uint8List?> nonce,
      Value<String?> lastError,
      required DateTime updatedAt,
      Value<int> rowid,
    });
typedef $$DownloadedLessonsTableUpdateCompanionBuilder =
    DownloadedLessonsCompanion Function({
      Value<String> lessonId,
      Value<DownloadState> state,
      Value<String> filePath,
      Value<int> bytesDownloaded,
      Value<int?> totalBytes,
      Value<Uint8List?> nonce,
      Value<String?> lastError,
      Value<DateTime> updatedAt,
      Value<int> rowid,
    });

class $$DownloadedLessonsTableFilterComposer
    extends Composer<_$AppDatabase, $DownloadedLessonsTable> {
  $$DownloadedLessonsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnFilters(column),
  );

  ColumnWithTypeConverterFilters<DownloadState, DownloadState, String>
  get state => $composableBuilder(
    column: $table.state,
    builder: (column) => ColumnWithTypeConverterFilters(column),
  );

  ColumnFilters<String> get filePath => $composableBuilder(
    column: $table.filePath,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get bytesDownloaded => $composableBuilder(
    column: $table.bytesDownloaded,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<int> get totalBytes => $composableBuilder(
    column: $table.totalBytes,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<Uint8List> get nonce => $composableBuilder(
    column: $table.nonce,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnFilters(column),
  );

  ColumnFilters<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnFilters(column),
  );
}

class $$DownloadedLessonsTableOrderingComposer
    extends Composer<_$AppDatabase, $DownloadedLessonsTable> {
  $$DownloadedLessonsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get lessonId => $composableBuilder(
    column: $table.lessonId,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get state => $composableBuilder(
    column: $table.state,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get filePath => $composableBuilder(
    column: $table.filePath,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get bytesDownloaded => $composableBuilder(
    column: $table.bytesDownloaded,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<int> get totalBytes => $composableBuilder(
    column: $table.totalBytes,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<Uint8List> get nonce => $composableBuilder(
    column: $table.nonce,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<String> get lastError => $composableBuilder(
    column: $table.lastError,
    builder: (column) => ColumnOrderings(column),
  );

  ColumnOrderings<DateTime> get updatedAt => $composableBuilder(
    column: $table.updatedAt,
    builder: (column) => ColumnOrderings(column),
  );
}

class $$DownloadedLessonsTableAnnotationComposer
    extends Composer<_$AppDatabase, $DownloadedLessonsTable> {
  $$DownloadedLessonsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get lessonId =>
      $composableBuilder(column: $table.lessonId, builder: (column) => column);

  GeneratedColumnWithTypeConverter<DownloadState, String> get state =>
      $composableBuilder(column: $table.state, builder: (column) => column);

  GeneratedColumn<String> get filePath =>
      $composableBuilder(column: $table.filePath, builder: (column) => column);

  GeneratedColumn<int> get bytesDownloaded => $composableBuilder(
    column: $table.bytesDownloaded,
    builder: (column) => column,
  );

  GeneratedColumn<int> get totalBytes => $composableBuilder(
    column: $table.totalBytes,
    builder: (column) => column,
  );

  GeneratedColumn<Uint8List> get nonce =>
      $composableBuilder(column: $table.nonce, builder: (column) => column);

  GeneratedColumn<String> get lastError =>
      $composableBuilder(column: $table.lastError, builder: (column) => column);

  GeneratedColumn<DateTime> get updatedAt =>
      $composableBuilder(column: $table.updatedAt, builder: (column) => column);
}

class $$DownloadedLessonsTableTableManager
    extends
        RootTableManager<
          _$AppDatabase,
          $DownloadedLessonsTable,
          DownloadedLesson,
          $$DownloadedLessonsTableFilterComposer,
          $$DownloadedLessonsTableOrderingComposer,
          $$DownloadedLessonsTableAnnotationComposer,
          $$DownloadedLessonsTableCreateCompanionBuilder,
          $$DownloadedLessonsTableUpdateCompanionBuilder,
          (
            DownloadedLesson,
            BaseReferences<
              _$AppDatabase,
              $DownloadedLessonsTable,
              DownloadedLesson
            >,
          ),
          DownloadedLesson,
          PrefetchHooks Function()
        > {
  $$DownloadedLessonsTableTableManager(
    _$AppDatabase db,
    $DownloadedLessonsTable table,
  ) : super(
        TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$DownloadedLessonsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$DownloadedLessonsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$DownloadedLessonsTableAnnotationComposer(
                $db: db,
                $table: table,
              ),
          updateCompanionCallback:
              ({
                Value<String> lessonId = const Value.absent(),
                Value<DownloadState> state = const Value.absent(),
                Value<String> filePath = const Value.absent(),
                Value<int> bytesDownloaded = const Value.absent(),
                Value<int?> totalBytes = const Value.absent(),
                Value<Uint8List?> nonce = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                Value<DateTime> updatedAt = const Value.absent(),
                Value<int> rowid = const Value.absent(),
              }) => DownloadedLessonsCompanion(
                lessonId: lessonId,
                state: state,
                filePath: filePath,
                bytesDownloaded: bytesDownloaded,
                totalBytes: totalBytes,
                nonce: nonce,
                lastError: lastError,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          createCompanionCallback:
              ({
                required String lessonId,
                required DownloadState state,
                required String filePath,
                Value<int> bytesDownloaded = const Value.absent(),
                Value<int?> totalBytes = const Value.absent(),
                Value<Uint8List?> nonce = const Value.absent(),
                Value<String?> lastError = const Value.absent(),
                required DateTime updatedAt,
                Value<int> rowid = const Value.absent(),
              }) => DownloadedLessonsCompanion.insert(
                lessonId: lessonId,
                state: state,
                filePath: filePath,
                bytesDownloaded: bytesDownloaded,
                totalBytes: totalBytes,
                nonce: nonce,
                lastError: lastError,
                updatedAt: updatedAt,
                rowid: rowid,
              ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ),
      );
}

typedef $$DownloadedLessonsTableProcessedTableManager =
    ProcessedTableManager<
      _$AppDatabase,
      $DownloadedLessonsTable,
      DownloadedLesson,
      $$DownloadedLessonsTableFilterComposer,
      $$DownloadedLessonsTableOrderingComposer,
      $$DownloadedLessonsTableAnnotationComposer,
      $$DownloadedLessonsTableCreateCompanionBuilder,
      $$DownloadedLessonsTableUpdateCompanionBuilder,
      (
        DownloadedLesson,
        BaseReferences<
          _$AppDatabase,
          $DownloadedLessonsTable,
          DownloadedLesson
        >,
      ),
      DownloadedLesson,
      PrefetchHooks Function()
    >;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$CachedCoursesTableTableManager get cachedCourses =>
      $$CachedCoursesTableTableManager(_db, _db.cachedCourses);
  $$CachedSectionsTableTableManager get cachedSections =>
      $$CachedSectionsTableTableManager(_db, _db.cachedSections);
  $$CachedLessonsTableTableManager get cachedLessons =>
      $$CachedLessonsTableTableManager(_db, _db.cachedLessons);
  $$ProgressOutboxTableTableManager get progressOutbox =>
      $$ProgressOutboxTableTableManager(_db, _db.progressOutbox);
  $$NotesOutboxTableTableManager get notesOutbox =>
      $$NotesOutboxTableTableManager(_db, _db.notesOutbox);
  $$BookmarksOutboxTableTableManager get bookmarksOutbox =>
      $$BookmarksOutboxTableTableManager(_db, _db.bookmarksOutbox);
  $$DownloadedLessonsTableTableManager get downloadedLessons =>
      $$DownloadedLessonsTableTableManager(_db, _db.downloadedLessons);
}
