from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default=''
    )
    completed = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'completed', 'created_at']
        read_only_fields = ['id', 'created_at']
